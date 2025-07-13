import {
  AIProvider,
  AIProviderConfig,
  AIResponse,
  AIMessage,
} from "./AIProvider";
import { VectorSearchResult } from "../../types";

interface OllamaRequest {
  model: string;
  prompt?: string;
  messages?: AIMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    top_k?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response?: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    size: number;
    digest: string;
    details: {
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
  }>;
}

export class OllamaProvider extends AIProvider {
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: AIProviderConfig = {}) {
    super("ollama", config);
    this.baseUrl = config.endpoint || "http://localhost:11434";
    this.defaultModel = config.model || "llama3.1:latest";
  }

  async generateResponse(
    query: string,
    similarDocuments: VectorSearchResult[],
    messages?: AIMessage[],
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let prompt: string;
      let useChat = false;

      if (messages && messages.length > 0) {
        // Use chat completion if messages are provided
        useChat = true;
      } else {
        // Use simple completion with system prompt
        const systemPrompt = this.buildSystemPrompt(query, similarDocuments);
        prompt = `${systemPrompt}\n\nPlease provide your response:`;
      }

      const requestBody: OllamaRequest = {
        model: this.defaultModel,
        stream: false,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 500,
        },
      };

      if (useChat && messages) {
        // Add system message with context
        const systemMessage: AIMessage = {
          role: "system",
          content: this.buildSystemPrompt(query, similarDocuments),
        };

        requestBody.messages = [systemMessage, ...messages];
      } else {
        requestBody.prompt = prompt!;
      }

      const endpoint = useChat ? "/api/chat" : "/api/generate";
      const response = await this.makeRequest(endpoint, requestBody);

      if (!response.done) {
        throw new Error("Incomplete response from Ollama");
      }

      const content = useChat ? response.message?.content : response.response;

      if (!content || !this.validateResponse(content)) {
        throw new Error("Invalid or empty response content");
      }

      const responseTime = Date.now() - startTime;

      return {
        content: content.trim(),
        metadata: {
          provider: this.name,
          model: this.defaultModel,
          tokens: response.eval_count,
          responseTime,
          confidence: this.calculateConfidence(similarDocuments),
        },
      };
    } catch (error) {
      console.error("Ollama provider error:", error);
      throw this.handleError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as OllamaTagsResponse;

      // Check if our default model is available
      const models = data.models || [];
      const hasModel = models.some(
        (model: any) =>
          model.name === this.defaultModel ||
          model.name.startsWith(this.defaultModel.split(":")[0]),
      );

      return hasModel;
    } catch (error) {
      console.error("Ollama health check failed:", error);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest("/api/tags");
      const data = response as unknown as OllamaTagsResponse;
      const models = data.models || [];
      return models.map((model) => model.name);
    } catch (error) {
      console.error("Failed to list Ollama models:", error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to pull Ollama model:", error);
      return false;
    }
  }

  private async makeRequest(
    endpoint: string,
    body?: any,
  ): Promise<OllamaResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = this.config.timeout || 30000; // 30 second default

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.config.customHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as OllamaResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  private calculateConfidence(similarDocuments: VectorSearchResult[]): number {
    if (similarDocuments.length === 0) return 0.3; // Low confidence without context

    const avgSimilarity =
      similarDocuments.reduce((sum, doc) => sum + doc.similarity, 0) /
      similarDocuments.length;
    const topSimilarity = Math.max(
      ...similarDocuments.map((doc) => doc.similarity),
    );

    // Confidence based on similarity scores and number of sources
    const similarityFactor = (avgSimilarity + topSimilarity) / 2;
    const sourceFactor = Math.min(similarDocuments.length / 5, 1); // Max benefit from 5 sources

    return Math.min(0.9, 0.4 + similarityFactor * 0.4 + sourceFactor * 0.1);
  }

  setModel(modelName: string): void {
    this.defaultModel = modelName;
  }

  getModel(): string {
    return this.defaultModel;
  }

  getEndpoint(): string {
    return this.baseUrl;
  }

  updateConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.endpoint) {
      this.baseUrl = newConfig.endpoint;
    }

    if (newConfig.model) {
      this.defaultModel = newConfig.model;
    }
  }
}
