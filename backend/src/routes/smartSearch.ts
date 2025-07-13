import { Router, Request, Response } from "express";
import { getDB } from "../server";
import { EmbeddingService } from "../services/embeddingService";
import { DatabaseService } from "../services/databaseService";
import { AIService, defaultAIServiceConfig } from "../services/ai/AIService";
import {
  SmartSearchRequest,
  SmartSearchResponse,
  TypedRequest,
} from "../types";

const router = Router();

let embeddingService: EmbeddingService;
let databaseService: DatabaseService;
let aiService: AIService;

const initializeServices = () => {
  if (!aiService) {
    const aiConfig = {
      ...defaultAIServiceConfig,

      providers: {
        ollama: {
          endpoint: process.env.OLLAMA_ENDPOINT || "http://localhost:11434",
          model: process.env.OLLAMA_MODEL || "llama3.1:latest",
          temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || "0.7"),
          maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || "500"),
          timeout: parseInt(process.env.OLLAMA_TIMEOUT || "30000"),
        },
      },
    };

    aiService = new AIService(aiConfig);
    console.log("🤖 AI Service initialized with *Ollama* provider");
  }

  if (!embeddingService) {
    embeddingService = new EmbeddingService({
      endpoint: process.env.OLLAMA_ENDPOINT || "http://localhost:11434",
      model: process.env.OLLAMA_EMBED_MODEL || "llama3.1:latest",
      timeout: parseInt(process.env.OLLAMA_TIMEOUT || "30000"),
    });
    console.log("🧩 Embedding Service initialized with *Ollama* model");
  }

  if (!databaseService) {
    const db = getDB();
    databaseService = new DatabaseService(db, embeddingService, aiService);
    embeddingService.setAIService(aiService);
  }
};

router.post(
  "/smart-search",
  async (
    req: TypedRequest<SmartSearchRequest>,
    res: Response,
  ): Promise<void> => {
    try {
      initializeServices();

      const { query, limit = 5, threshold = 0.7 } = req.body;

      if (!query || query.trim().length === 0) {
        res
          .status(400)
          .json({ error: "Query is required and cannot be empty" });
        return;
      }

      console.log(`Smart search query: "${query}"`);

      const aiResponse = await databaseService.smartSearch(
        query,
        threshold,
        limit,
      );

      console.log(
        `Generated response using ${aiResponse.metadata.provider} (${aiResponse.source})`,
      );

      // Get similar documents for source attribution
      const similarDocuments = await databaseService.vectorSearch(
        query,
        threshold,
        limit,
      );

      const response: SmartSearchResponse = {
        response: aiResponse.content,
        sources: similarDocuments.map((result) => result.document),
        similarity_scores: similarDocuments.map((result) => result.similarity),
      };

      res.json(response);
    } catch (error) {
      console.error("Error in smart search:", error);
      res.status(500).json({
        error: "Internal server error during smart search",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Enhanced prompt saving endpoint that includes embedding generation
 */
router.post(
  "/smart-prompt",
  async (req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      const { prompt, response } = req.body;

      if (!prompt || !response) {
        res
          .status(400)
          .json({ error: "Both prompt and response are required" });
        return;
      }

      console.log(`Saving smart prompt: "${prompt.substring(0, 50)}..."`);

      // Save prompt with embedding
      const promptId = await databaseService.savePromptWithEmbedding(
        prompt,
        response,
      );

      res.json({
        id: promptId,
        message: "Prompt saved successfully with embedding",
        prompt: prompt,
        response: response,
      });
    } catch (error) {
      console.error("Error saving smart prompt:", error);
      res.status(500).json({
        error: "Internal server error while saving prompt",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Migrate existing prompts to include embeddings
 */
router.post(
  "/migrate-embeddings",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      console.log("Starting embedding migration...");

      const updatedCount = await databaseService.updatePromptsWithEmbeddings();

      res.json({
        message: "Embedding migration completed",
        updated_count: updatedCount,
      });
    } catch (error) {
      console.error("Error during embedding migration:", error);
      res.status(500).json({
        error: "Internal server error during migration",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Get embedding statistics
 */
router.get(
  "/embedding-stats",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      const stats = await databaseService.getEmbeddingStats();

      res.json({
        ...stats,
        embedding_coverage:
          stats.totalPrompts > 0
            ? (
                (stats.promptsWithEmbeddings / stats.totalPrompts) *
                100
              ).toFixed(2) + "%"
            : "0%",
      });
    } catch (error) {
      console.error("Error getting embedding stats:", error);
      res.status(500).json({
        error: "Internal server error while getting stats",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Search for similar prompts without generating AI response
 */
router.post(
  "/find-similar",
  async (
    req: TypedRequest<SmartSearchRequest>,
    res: Response,
  ): Promise<void> => {
    try {
      initializeServices();

      const { query, limit = 5, threshold = 0.7 } = req.body;

      if (!query || query.trim().length === 0) {
        res
          .status(400)
          .json({ error: "Query is required and cannot be empty" });
        return;
      }

      console.log(`Finding similar prompts for: "${query}"`);

      // Perform vector search
      const similarDocuments = await databaseService.vectorSearch(
        query,
        threshold,
        limit,
      );

      res.json({
        query,
        found_count: similarDocuments.length,
        results: similarDocuments.map((result) => ({
          document: result.document,
          similarity_score: result.similarity,
          similarity_percentage: (result.similarity * 100).toFixed(1) + "%",
        })),
      });
    } catch (error) {
      console.error("Error finding similar prompts:", error);
      res.status(500).json({
        error: "Internal server error while finding similar prompts",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Health check for smart search functionality
 */
router.get(
  "/smart-health",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      const openaiApiKey = process.env.OPENAI_API_KEY;
      const dbConnected = !!getDB();

      // Get AI service health status
      const aiHealthStatus = await databaseService.getAIServiceHealth();
      const aiServiceInfo = databaseService.getAIServiceInfo();

      res.json({
        status: "healthy",
        openai_configured: !!openaiApiKey,
        database_connected: dbConnected,
        embedding_service: !!embeddingService,
        database_service: !!databaseService,
        ai_service: {
          configured: !!aiService,
          info: aiServiceInfo,
          providers: aiHealthStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in smart health check:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

/**
 * Test AI service with sample query
 */
router.post("/test-ai", async (_req: Request, res: Response): Promise<void> => {
  try {
    initializeServices();

    const testResult = await databaseService.testAIService();
    const healthStatus = await databaseService.getAIServiceHealth();

    res.json({
      ai_service_working: testResult,
      providers_health: healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing AI service:", error);
    res.status(500).json({
      error: "Failed to test AI service",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get available AI models (Ollama specific)
 */
router.get(
  "/ai-models",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      const models = await aiService.listAvailableModels();

      res.json({
        available_models: models,
        current_model: aiService.getOllamaProvider()?.getModel(),
        endpoint: aiService.getOllamaProvider()?.getEndpoint(),
      });
    } catch (error) {
      console.error("Error listing AI models:", error);
      res.status(500).json({
        error: "Failed to list AI models",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Pull a new model (Ollama specific)
 */
router.post(
  "/ai-models/pull",
  async (req: Request, res: Response): Promise<void> => {
    try {
      initializeServices();

      const { model } = req.body;
      if (!model) {
        res.status(400).json({ error: "Model name is required" });
        return;
      }

      const success = await aiService.pullModel(model);

      res.json({
        success,
        model,
        message: success
          ? `Model ${model} pulled successfully`
          : `Failed to pull model ${model}`,
      });
    } catch (error) {
      console.error("Error pulling AI model:", error);
      res.status(500).json({
        error: "Failed to pull AI model",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
