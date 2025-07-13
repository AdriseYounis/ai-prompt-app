import { Collection, Db } from "mongodb";
import { PromptDocument, VectorSearchResult } from "../types";
import { EmbeddingService } from "./embeddingService";
import { AIService, AIServiceResponse } from "./ai/AIService";

export class DatabaseService {
  private promptsCollection: Collection<PromptDocument>;
  private embeddingService: EmbeddingService;
  private aiService: AIService | null = null;

  constructor(
    db: Db,
    embeddingService: EmbeddingService,
    aiService?: AIService,
  ) {
    // this.db = db; // Not used directly, keeping reference for future use
    this.promptsCollection = db.collection<PromptDocument>("prompts");
    this.embeddingService = embeddingService;
    this.aiService = aiService || null;
  }

  /**
   * Save a prompt with its embedding
   */
  async savePromptWithEmbedding(
    prompt: string,
    response: string,
  ): Promise<string> {
    try {
      // Generate embedding for the prompt
      const embedding = await this.embeddingService.generateEmbedding(prompt);

      const newPrompt: PromptDocument = {
        prompt,
        response,
        embedding,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.promptsCollection.insertOne(newPrompt);
      console.log("Prompt saved with embedding, ID:", result.insertedId);

      return result.insertedId.toString();
    } catch (error) {
      console.error("Error saving prompt with embedding:", error);
      throw new Error("Failed to save prompt with embedding");
    }
  }

  /**
   * Get all prompts with embeddings
   */
  async getAllPromptsWithEmbeddings(): Promise<PromptDocument[]> {
    try {
      const prompts = await this.promptsCollection
        .find({
          embedding: { $exists: true },
          "embedding.0": { $exists: true },
        })
        .sort({ createdAt: -1 })
        .toArray();

      return prompts;
    } catch (error) {
      console.error("Error fetching prompts with embeddings:", error);
      throw new Error("Failed to fetch prompts with embeddings");
    }
  }

  /**
   * Perform vector search across all prompts
   */
  async vectorSearch(
    query: string,
    threshold: number = 0.7,
    limit: number = 5,
  ): Promise<VectorSearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);

      // Get all documents with embeddings
      const documents = await this.getAllPromptsWithEmbeddings();

      // Find similar documents
      const similarDocuments = this.embeddingService.findSimilarDocuments(
        queryEmbedding,
        documents,
        threshold,
        limit,
      );

      return similarDocuments;
    } catch (error) {
      console.error("Error performing vector search:", error);
      throw new Error("Failed to perform vector search");
    }
  }

  /**
   * Perform smart search with AI response generation and fallback
   */
  async smartSearch(
    query: string,
    threshold: number = 0.7,
    limit: number = 5,
  ): Promise<AIServiceResponse> {
    try {
      // First, perform vector search to find similar documents
      const similarDocuments = await this.vectorSearch(query, threshold, limit);
      return await this.embeddingService.generateSmartResponse(
        query,
        similarDocuments,
      );

      // Generate smart response using AI service or embedding service
      // if (this.aiService) {
      //   return await this.aiService.generateResponse(query, similarDocuments);
      // } else {
      //   // Fallback to embedding service
      //   return await this.embeddingService.generateSmartResponse(
      //     query,
      //     similarDocuments,
      //   );
      // }
    } catch (error) {
      console.error("Error performing smart search:", error);
      throw new Error("Failed to perform smart search");
    }
  }

  /**
   * Update existing prompts with embeddings (for migration)
   */
  async updatePromptsWithEmbeddings(): Promise<number> {
    try {
      const promptsWithoutEmbeddings = await this.promptsCollection
        .find({
          $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
        })
        .toArray();

      if (promptsWithoutEmbeddings.length === 0) {
        console.log("All prompts already have embeddings");
        return 0;
      }

      console.log(
        `Updating ${promptsWithoutEmbeddings.length} prompts with embeddings...`,
      );

      const texts = promptsWithoutEmbeddings.map((doc) => doc.prompt);
      const embeddings =
        await this.embeddingService.batchGenerateEmbeddings(texts);

      let updatedCount = 0;
      for (let i = 0; i < promptsWithoutEmbeddings.length; i++) {
        const doc = promptsWithoutEmbeddings[i];
        const embedding = embeddings[i];

        if (this.embeddingService.isValidEmbedding(embedding)) {
          await this.promptsCollection.updateOne(
            { _id: doc._id },
            {
              $set: {
                embedding,
                updatedAt: new Date(),
              },
            },
          );
          updatedCount++;
        } else {
          console.warn(`Invalid embedding for document ${doc._id}`);
        }
      }

      console.log(
        `Successfully updated ${updatedCount} prompts with embeddings`,
      );
      return updatedCount;
    } catch (error) {
      console.error("Error updating prompts with embeddings:", error);
      throw new Error("Failed to update prompts with embeddings");
    }
  }

  /**
   * Get recent prompts (without embeddings requirement)
   */
  async getRecentPrompts(limit: number = 10): Promise<PromptDocument[]> {
    try {
      const prompts = await this.promptsCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return prompts;
    } catch (error) {
      console.error("Error fetching recent prompts:", error);
      throw new Error("Failed to fetch recent prompts");
    }
  }

  /**
   * Delete a prompt by ID
   */
  async deletePrompt(id: string): Promise<boolean> {
    try {
      const result = await this.promptsCollection.deleteOne({ _id: id as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting prompt:", error);
      throw new Error("Failed to delete prompt");
    }
  }

  /**
   * Get prompt count
   */
  async getPromptCount(): Promise<number> {
    try {
      return await this.promptsCollection.countDocuments();
    } catch (error) {
      console.error("Error counting prompts:", error);
      throw new Error("Failed to count prompts");
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    totalPrompts: number;
    promptsWithEmbeddings: number;
    promptsWithoutEmbeddings: number;
  }> {
    try {
      const totalPrompts = await this.promptsCollection.countDocuments();
      const promptsWithEmbeddings = await this.promptsCollection.countDocuments(
        {
          embedding: { $exists: true },
          "embedding.0": { $exists: true },
        },
      );
      const promptsWithoutEmbeddings = totalPrompts - promptsWithEmbeddings;

      return {
        totalPrompts,
        promptsWithEmbeddings,
        promptsWithoutEmbeddings,
      };
    } catch (error) {
      console.error("Error getting embedding stats:", error);
      throw new Error("Failed to get embedding stats");
    }
  }

  /**
   * Create indexes for better performance
   */
  async createIndexes(): Promise<void> {
    try {
      await this.promptsCollection.createIndex({ createdAt: -1 });
      await this.promptsCollection.createIndex({ updatedAt: -1 });
      await this.promptsCollection.createIndex({ embedding: 1 });
      console.log("Database indexes created successfully");
    } catch (error) {
      console.error("Error creating indexes:", error);
      throw new Error("Failed to create indexes");
    }
  }

  /**
   * Set AI service for enhanced response generation
   */
  setAIService(aiService: AIService): void {
    this.aiService = aiService;
    // Also set it on the embedding service
    this.embeddingService.setAIService(aiService);
  }

  /**
   * Get AI service health status
   */
  async getAIServiceHealth(): Promise<Record<string, boolean> | null> {
    if (!this.aiService) {
      return null;
    }
    return await this.aiService.getHealthStatus();
  }

  /**
   * Get AI service information
   */
  getAIServiceInfo() {
    return this.aiService?.getServiceInfo() || null;
  }

  /**
   * Test AI service with a sample query
   */
  async testAIService(): Promise<boolean> {
    if (!this.aiService) {
      return false;
    }

    try {
      const testQuery = "Hello, this is a test query";
      const response = await this.aiService.generateResponse(testQuery, []);
      return response.content.length > 0;
    } catch (error) {
      console.error("AI service test failed:", error);
      return false;
    }
  }
}
