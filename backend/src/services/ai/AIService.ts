import { VectorSearchResult } from "../../types";
import { AIProvider, AIProviderConfig, AIProviderError } from "./AIProvider";
import { OllamaProvider } from "./OllamaProvider";
import { FallbackResponseGenerator } from "./FallbackResponseGenerator";

export interface AIServiceConfig {
  primaryProvider: "ollama" | "openai" | "anthropic" | "custom";
  fallbackEnabled: boolean;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  providers: {
    ollama?: AIProviderConfig;
    openai?: AIProviderConfig;
    anthropic?: AIProviderConfig;
    custom?: AIProviderConfig;
  };
}

export interface AIServiceResponse {
  content: string;
  source: "ai" | "fallback";
  metadata: {
    provider: string;
    model?: string;
    tokens?: number;
    responseTime: number;
    confidence: number;
    retryCount?: number;
    fallbackReason?: string;
  };
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private fallbackGenerator: FallbackResponseGenerator;
  private config: AIServiceConfig;
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.fallbackGenerator = new FallbackResponseGenerator();
    this.initializeProviders();
  }

  /**
   * Generate response using primary AI provider with intelligent fallback
   */
  async generateResponse(
    query: string,
    similarDocuments: VectorSearchResult[],
  ): Promise<AIServiceResponse> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: AIProviderError | null = null;

    // Try primary provider with retries
    while (retryCount <= this.config.retryAttempts) {
      try {
        const primaryProvider = this.getPrimaryProvider();

        if (!primaryProvider) {
          throw new Error("Primary AI provider not available");
        }

        // Check provider health before making request
        if (!(await this.checkProviderHealth(primaryProvider))) {
          throw new Error("Primary provider failed health check");
        }

        const aiResponse = await primaryProvider.generateResponse(
          query,
          similarDocuments,
        );

        return {
          content: aiResponse.content,
          source: "ai",
          metadata: {
            ...aiResponse.metadata,
            confidence: aiResponse.metadata.confidence || 0.5,
            retryCount: retryCount > 0 ? retryCount : undefined,
          },
        };
      } catch (error) {
        lastError =
          error instanceof Error
            ? { type: "unknown", message: error.message, retryable: true }
            : (error as AIProviderError);

        console.warn(
          `AI provider attempt ${retryCount + 1} failed:`,
          lastError.message,
        );

        // Check if error is retryable
        if (!lastError.retryable || retryCount >= this.config.retryAttempts) {
          break;
        }

        retryCount++;

        // Exponential backoff
        if (retryCount <= this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
          await this.sleep(delay);
        }
      }
    }

    // Fallback to vector-based response
    if (this.config.fallbackEnabled) {
      console.log("Falling back to vector-based response generation");

      const fallbackResponse = this.fallbackGenerator.generateFallbackResponse(
        query,
        similarDocuments,
      );

      return {
        content: fallbackResponse.content,
        source: "fallback",
        metadata: {
          provider: "vector-fallback",
          responseTime: Date.now() - startTime,
          confidence: fallbackResponse.metadata.confidence,
          retryCount,
          fallbackReason: lastError?.message || "AI provider unavailable",
        },
      };
    }

    // If fallback is disabled, throw the last error
    throw new Error(
      `AI service failed: ${lastError?.message || "Unknown error"}`,
    );
  }

  /**
   * Get health status of all providers
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        status[name] = await this.checkProviderHealth(provider);
      } catch (error) {
        status[name] = false;
      }
    }

    return status;
  }

  /**
   * Get detailed service information
   */
  getServiceInfo() {
    const providers: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      providers[name] = {
        ...provider.getProviderInfo(),
        healthy: this.healthStatus.get(name) || false,
        lastHealthCheck: this.lastHealthCheck.get(name),
      };
    }

    return {
      primaryProvider: this.config.primaryProvider,
      fallbackEnabled: this.config.fallbackEnabled,
      retryAttempts: this.config.retryAttempts,
      providers,
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize providers if provider configs changed
    if (newConfig.providers) {
      this.initializeProviders();
    }
  }

  /**
   * Add a custom provider
   */
  addProvider(name: string, provider: AIProvider) {
    this.providers.set(name, provider);
    console.log(`Added custom AI provider: ${name}`);
  }

  /**
   * Switch primary provider
   */
  setPrimaryProvider(providerName: string) {
    if (this.providers.has(providerName)) {
      this.config.primaryProvider = providerName as any;
      console.log(`Switched primary provider to: ${providerName}`);
    } else {
      throw new Error(`Provider ${providerName} not found`);
    }
  }

  /**
   * Test a specific provider
   */
  async testProvider(
    providerName: string,
    testQuery: string = "Hello, how are you?",
  ): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      const response = await provider.generateResponse(testQuery, []);
      return response.content.length > 0;
    } catch (error) {
      console.error(`Provider ${providerName} test failed:`, error);
      return false;
    }
  }

  private initializeProviders() {
    this.providers.clear();

    // Initialize Ollama provider
    if (this.config.providers.ollama) {
      const ollamaProvider = new OllamaProvider(this.config.providers.ollama);
      this.providers.set("ollama", ollamaProvider);
    }

    // Initialize OpenAI provider (if implemented)
    // if (this.config.providers.openai) {
    //   const openaiProvider = new OpenAIProvider(this.config.providers.openai);
    //   this.providers.set('openai', openaiProvider);
    // }

    // Initialize Anthropic provider (if implemented)
    // if (this.config.providers.anthropic) {
    //   const anthropicProvider = new AnthropicProvider(this.config.providers.anthropic);
    //   this.providers.set('anthropic', anthropicProvider);
    // }

    console.log(`Initialized ${this.providers.size} AI providers`);
  }

  private getPrimaryProvider(): AIProvider | null {
    return this.providers.get(this.config.primaryProvider) || null;
  }

  private async checkProviderHealth(provider: AIProvider): Promise<boolean> {
    const providerName = provider.getProviderInfo().name;
    const now = Date.now();
    const lastCheck = this.lastHealthCheck.get(providerName) || 0;

    // Use cached health status if checked recently (within interval)
    if (now - lastCheck < this.config.healthCheckInterval) {
      return this.healthStatus.get(providerName) || false;
    }

    // Perform new health check
    try {
      const isHealthy = await provider.healthCheck();
      this.healthStatus.set(providerName, isHealthy);
      this.lastHealthCheck.set(providerName, now);
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${providerName}:`, error);
      this.healthStatus.set(providerName, false);
      this.lastHealthCheck.set(providerName, now);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log("Shutting down AI service...");
    this.providers.clear();
    this.healthStatus.clear();
    this.lastHealthCheck.clear();
  }

  /**
   * Get provider-specific methods for Ollama
   */
  getOllamaProvider(): OllamaProvider | null {
    const provider = this.providers.get("ollama");
    return provider instanceof OllamaProvider ? provider : null;
  }

  /**
   * List available models for the primary provider
   */
  async listAvailableModels(): Promise<string[]> {
    const primaryProvider = this.getPrimaryProvider();

    if (primaryProvider instanceof OllamaProvider) {
      return await primaryProvider.listModels();
    }

    return [];
  }

  /**
   * Pull a model (Ollama specific)
   */
  async pullModel(modelName: string): Promise<boolean> {
    const ollamaProvider = this.getOllamaProvider();

    if (ollamaProvider) {
      return await ollamaProvider.pullModel(modelName);
    }

    throw new Error("Model pulling only supported for Ollama provider");
  }
}

// Default configuration
export const defaultAIServiceConfig: AIServiceConfig = {
  primaryProvider: "ollama",
  fallbackEnabled: true,
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
  healthCheckInterval: 30000, // 30 seconds
  providers: {
    ollama: {
      endpoint: "http://localhost:11434",
      model: "llama3.1:latest",
      temperature: 0.7,
      maxTokens: 500,
      timeout: 30000,
    },
  },
};
