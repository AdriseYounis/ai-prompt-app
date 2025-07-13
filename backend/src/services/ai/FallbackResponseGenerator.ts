import { VectorSearchResult } from '../../types';

export interface FallbackResponse {
  content: string;
  metadata: {
    provider: 'vector-fallback';
    sourceCount: number;
    avgSimilarity: number;
    responseTime: number;
    confidence: number;
  };
}

export class FallbackResponseGenerator {
  /**
   * Generate a coherent response based on vector search results when AI providers fail
   */
  generateFallbackResponse(
    query: string,
    similarDocuments: VectorSearchResult[]
  ): FallbackResponse {
    const startTime = Date.now();

    if (similarDocuments.length === 0) {
      return this.generateNoResultsResponse(query, startTime);
    }

    const content = this.createStructuredResponse(query, similarDocuments);
    const avgSimilarity = this.calculateAverageSimilarity(similarDocuments);
    const confidence = this.calculateConfidence(similarDocuments, avgSimilarity);

    return {
      content,
      metadata: {
        provider: 'vector-fallback',
        sourceCount: similarDocuments.length,
        avgSimilarity,
        responseTime: Date.now() - startTime,
        confidence,
      },
    };
  }

  private createStructuredResponse(
    query: string,
    similarDocuments: VectorSearchResult[]
  ): string {
    const topResults = similarDocuments.slice(0, 5);
    const bestMatch = topResults[0];
    const bestSimilarity = (bestMatch.similarity * 100).toFixed(1);

    // Start with a contextual introduction
    let response = `Based on your question about "${query}", I found ${topResults.length} relevant ${
      topResults.length === 1 ? 'entry' : 'entries'
    } in our knowledge base.\n\n`;

    // Add the best matching response if similarity is high
    if (bestMatch.similarity >= 0.8) {
      response += `**Most Relevant Answer** (${bestSimilarity}% match):\n`;
      response += `${bestMatch.document.response}\n\n`;
    }

    // Extract and present key insights
    const insights = this.extractKeyInsights(topResults);
    if (insights.length > 0) {
      response += `**Key Insights:**\n`;
      insights.forEach((insight, index) => {
        response += `${index + 1}. ${insight}\n`;
      });
      response += '\n';
    }

    // Add detailed information from sources
    if (topResults.length > 1 || bestMatch.similarity < 0.8) {
      response += `**Additional Information:**\n\n`;

      topResults.forEach((result, index) => {
        const similarity = (result.similarity * 100).toFixed(1);
        if (index === 0 && bestMatch.similarity >= 0.8) return; // Skip if already shown above

        response += `**Source ${index + 1}** (${similarity}% match):\n`;
        response += `*Question:* ${result.document.prompt}\n`;
        response += `*Answer:* ${result.document.response}\n\n`;
      });
    }

    // Add source attribution
    response += `---\n`;
    response += `*This response is compiled from ${topResults.length} related ${
      topResults.length === 1 ? 'entry' : 'entries'
    } in our knowledge base. `;

    if (bestMatch.similarity >= 0.9) {
      response += `We found a highly relevant match (${bestSimilarity}% similarity).*`;
    } else if (bestMatch.similarity >= 0.7) {
      response += `We found good matches with ${bestSimilarity}% similarity.*`;
    } else {
      response += `The closest matches have ${bestSimilarity}% similarity. Consider refining your question for better results.*`;
    }

    return response;
  }

  private extractKeyInsights(results: VectorSearchResult[]): string[] {
    const insights: string[] = [];
    const seenInsights = new Set<string>();

    for (const result of results) {
      const response = result.document.response;

      // Extract numbered lists
      const numberedItems = response.match(/^\d+[\.)]\s+(.+)$/gm);
      if (numberedItems) {
        numberedItems.slice(0, 3).forEach(item => {
          const cleaned = item.replace(/^\d+[\.)]\s+/, '').trim();
          const key = cleaned.toLowerCase().substring(0, 50);
          if (!seenInsights.has(key) && cleaned.length > 10) {
            insights.push(cleaned);
            seenInsights.add(key);
          }
        });
      }

      // Extract bullet points
      const bulletItems = response.match(/^[\-\*•]\s+(.+)$/gm);
      if (bulletItems) {
        bulletItems.slice(0, 3).forEach(item => {
          const cleaned = item.replace(/^[\-\*•]\s+/, '').trim();
          const key = cleaned.toLowerCase().substring(0, 50);
          if (!seenInsights.has(key) && cleaned.length > 10) {
            insights.push(cleaned);
            seenInsights.add(key);
          }
        });
      }

      // Extract sentences that contain key phrases
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
      for (const sentence of sentences.slice(0, 2)) {
        const cleaned = sentence.trim();
        const key = cleaned.toLowerCase().substring(0, 50);
        if (!seenInsights.has(key) && this.isKeyInsight(cleaned)) {
          insights.push(cleaned);
          seenInsights.add(key);
        }
      }

      if (insights.length >= 5) break; // Limit to 5 insights
    }

    return insights.slice(0, 5);
  }

  private isKeyInsight(sentence: string): boolean {
    const keyPhrases = [
      'best practice', 'important', 'key', 'essential', 'critical',
      'should', 'must', 'recommended', 'avoid', 'ensure',
      'optimize', 'improve', 'effective', 'efficient', 'secure'
    ];

    const lowerSentence = sentence.toLowerCase();
    return keyPhrases.some(phrase => lowerSentence.includes(phrase));
  }

  private calculateAverageSimilarity(results: VectorSearchResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, result) => acc + result.similarity, 0);
    return sum / results.length;
  }

  private calculateConfidence(results: VectorSearchResult[], avgSimilarity: number): number {
    if (results.length === 0) return 0.1;

    const topSimilarity = Math.max(...results.map(r => r.similarity));
    const sourceCount = Math.min(results.length, 5);

    // Base confidence from similarity scores
    const similarityFactor = (avgSimilarity + topSimilarity) / 2;

    // Bonus for multiple sources
    const sourceFactor = sourceCount / 5;

    // Penalty for low similarity
    const qualityPenalty = topSimilarity < 0.5 ? 0.3 : 0;

    const confidence = Math.max(0.1, Math.min(0.85,
      0.3 + (similarityFactor * 0.4) + (sourceFactor * 0.1) - qualityPenalty
    ));

    return confidence;
  }

  private generateNoResultsResponse(query: string, startTime: number): FallbackResponse {
    const suggestions = this.generateSearchSuggestions(query);

    let content = `I couldn't find any relevant information in our knowledge base for "${query}".\n\n`;

    content += `**Suggestions to get better results:**\n`;
    suggestions.forEach((suggestion, index) => {
      content += `${index + 1}. ${suggestion}\n`;
    });

    content += `\n*No matching entries found in the knowledge base. Consider adding more content or refining your search.*`;

    return {
      content,
      metadata: {
        provider: 'vector-fallback',
        sourceCount: 0,
        avgSimilarity: 0,
        responseTime: Date.now() - startTime,
        confidence: 0.1,
      },
    };
  }

  private generateSearchSuggestions(query: string): string[] {
    const suggestions = [
      'Try using different keywords or synonyms',
      'Make your question more specific',
      'Break complex questions into smaller parts',
      'Check for spelling errors',
    ];

    // Add context-specific suggestions based on query content
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('how') || lowerQuery.includes('what')) {
      suggestions.push('Try rephrasing as a declarative statement');
    }

    if (lowerQuery.length < 10) {
      suggestions.push('Provide more context in your question');
    }

    if (lowerQuery.includes('best') || lowerQuery.includes('better')) {
      suggestions.push('Try searching for specific techniques or methods');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Format similar documents for display without AI processing
   */
  formatSimilarDocuments(results: VectorSearchResult[]): string {
    if (results.length === 0) {
      return 'No similar documents found.';
    }

    let formatted = `Found ${results.length} similar ${results.length === 1 ? 'document' : 'documents'}:\n\n`;

    results.forEach((result, index) => {
      const similarity = (result.similarity * 100).toFixed(1);
      formatted += `**${index + 1}. ${result.document.prompt}** (${similarity}% match)\n`;
      formatted += `${result.document.response}\n`;
      formatted += `*Added: ${new Date(result.document.createdAt).toLocaleDateString()}*\n\n`;
    });

    return formatted;
  }
}
