import { VectorSearchResult } from "../../types";

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  endpoint?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
}

export interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    tokens?: number;
    responseTime: number;
    confidence?: number;
  };
}

export interface AIProviderError {
  type: 'network' | 'auth' | 'rate_limit' | 'model_error' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
  details?: any;
}

export abstract class AIProvider {
  protected config: AIProviderConfig;
  protected name: string;

  constructor(name: string, config: AIProviderConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Generate a response based on query and similar documents
   */
  abstract generateResponse(
    query: string,
    similarDocuments: VectorSearchResult[],
    messages?: AIMessage[]
  ): Promise<AIResponse>;

  /**
   * Check if the provider is available and healthy
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: this.name,
      config: {
        model: this.config.model,
        endpoint: this.config.endpoint,
        timeout: this.config.timeout,
      },
    };
  }

  /**
   * Handle provider-specific errors
   */
  protected handleError(error: any): AIProviderError {
    const baseError: AIProviderError = {
      type: 'unknown',
      message: 'An unknown error occurred',
      retryable: false,
    };

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        ...baseError,
        type: 'network',
        message: 'Network connection failed',
        retryable: true,
      };
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        ...baseError,
        type: 'timeout',
        message: 'Request timed out',
        retryable: true,
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        ...baseError,
        type: 'auth',
        message: 'Authentication failed',
        retryable: false,
      };
    }

    if (error.status === 429) {
      return {
        ...baseError,
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true,
      };
    }

    if (error.status >= 500) {
      return {
        ...baseError,
        type: 'model_error',
        message: 'Model service error',
        retryable: true,
      };
    }

    return {
      ...baseError,
      message: error.message || 'Unknown error',
      details: error,
    };
  }

  /**
   * Build system prompt for context-aware responses
   */
  protected buildSystemPrompt(query: string, similarDocuments: VectorSearchResult[]): string {
    const contextPrompts = similarDocuments
      .slice(0, 5) // Limit to top 5 for context size
      .map((result, index) => {
        const similarity = (result.similarity * 100).toFixed(1);
        return `[Context ${index + 1}] (Similarity: ${similarity}%)
Prompt: ${result.document.prompt}
Response: ${result.document.response}`;
      })
      .join('\n\n');

    return `You are an intelligent assistant that provides helpful responses based on a knowledge base of prompts and responses.

Use the following context to answer the user's query. The context items are ranked by similarity to the user's question.

Context from knowledge base:
${contextPrompts}

Guidelines:
- Provide a comprehensive, helpful response based on the context
- If the context contains relevant information, use it to inform your answer
- If the context doesn't fully address the query, supplement with general knowledge while noting what came from the knowledge base
- Be accurate, concise, and actionable
- Reference the context when it's directly relevant
- Maintain a helpful and professional tone

User Query: ${query}`;
  }

  /**
   * Validate response content
   */
  protected validateResponse(content: string): boolean {
    return (
      typeof content === 'string' &&
      content.trim().length > 0 &&
      content.trim().length < 10000 // Reasonable max length
    );
  }
}
