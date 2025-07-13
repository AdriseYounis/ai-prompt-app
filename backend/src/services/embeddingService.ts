import axios from "axios";
import { VectorSearchResult, PromptDocument } from "../types";
import { AIService, AIServiceResponse } from "./ai/AIService";

/**
 * Configuration options for Ollama embeddings
 */
interface OllamaConfig {
  endpoint: string; // e.g. "http://localhost:11434"
  model: string; // e.g. "llama3.1:latest"
  timeout?: number; // ms (default 30 000)
}

export class EmbeddingService {
  private readonly endpoint: string;
  private readonly model: string;
  private readonly timeout: number;
  private aiService: AIService | null = null;

  // Ollama always returns 768‑dim or 1536‑dim depending on the model
  private readonly EMBEDDING_DIMENSIONS = 1536;

  constructor(config: OllamaConfig, aiService?: AIService) {
    if (!config.endpoint || !config.model) {
      throw new Error("Ollama endpoint and model are required");
    }
    this.endpoint = config.endpoint;
    this.model = config.model;
    this.timeout = config.timeout ?? 30_000;
    this.aiService = aiService ?? null;
  }

  /**
   * Generate an embedding for a single text via Ollama
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const res = await axios.post(
        `${this.endpoint}/api/embeddings`,
        { model: this.model, prompt: text.trim() },
        { timeout: this.timeout },
      );

      if (!Array.isArray(res.data?.embedding)) {
        throw new Error("Invalid embedding payload from Ollama");
      }
      return res.data.embedding;
    } catch (err) {
      console.error("🧩 Ollama embedding failed:", err);
      throw new Error("Failed to generate embedding via Ollama");
    }
  }

  /**
   * Batch generate embeddings (processed sequentially to stay simple)
   */
  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const text of texts) {
      try {
        const emb = await this.generateEmbedding(text);
        out.push(emb);
      } catch {
        out.push([]); // preserve ordering, mark failure with empty vector
      }
    }
    return out;
  }

  /* ----------  VECTOR UTILITIES (unchanged) ---------- */

  calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error("Vector dim mismatch");
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] ** 2;
      nb += b[i] ** 2;
    }
    const mag = Math.sqrt(na) * Math.sqrt(nb);
    return mag ? dot / mag : 0;
  }

  findSimilarDocuments(
    queryEmb: number[],
    docs: PromptDocument[],
    threshold = 0.7,
    limit = 5,
  ): VectorSearchResult[] {
    return docs
      .filter((d) => d.embedding?.length)
      .map((d) => ({
        document: d,
        similarity: this.calculateSimilarity(queryEmb, d.embedding!),
      }))
      .filter((r) => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /* ----------  SMART RESPONSE (unchanged logic) ---------- */

  async generateSmartResponse(
    query: string,
    similar: VectorSearchResult[],
  ): Promise<AIServiceResponse> {
    if (this.aiService) {
      return this.aiService.generateResponse(query, similar);
    }
    // fallback—minimal response if AI service missing
    return {
      content: "AI service unavailable; please try later.",
      source: "fallback",
      metadata: {
        provider: "ollama-embedding-only",
        responseTime: 0,
        confidence: 0.2,
      },
    };
  }

  /* ----------  Helpers ---------- */

  isValidEmbedding(vec: number[]): boolean {
    return (
      Array.isArray(vec) &&
      vec.length === this.EMBEDDING_DIMENSIONS &&
      vec.every((v) => typeof v === "number")
    );
  }

  setAIService(ai: AIService) {
    this.aiService = ai;
  }

  getAIServiceInfo() {
    return this.aiService?.getServiceInfo() ?? null;
  }
}
