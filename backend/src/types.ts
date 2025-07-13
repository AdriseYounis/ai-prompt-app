import { Request } from "express";

export interface TypedRequest<T> extends Request {
  body: T;
}

export interface PromptRequest {
  prompt: string;
}

export interface PromptResponse {
  response: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
}

export interface ErrorResponse {
  error: string;
}

export interface Config {
  port: number;
  mongoUri: string;
  nodeEnv: string;
  jwtSecret: string;
  openaiApiKey: string;
}

export interface PromptDocument {
  _id?: string;
  prompt: string;
  response: string;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SmartSearchResponse {
  response: string;
  sources: PromptDocument[];
  similarity_scores: number[];
}

export interface VectorSearchResult {
  document: PromptDocument;
  similarity: number;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
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

export interface AIProviderHealth {
  [providerName: string]: boolean;
}

export interface AIServiceInfo {
  primaryProvider: string;
  fallbackEnabled: boolean;
  retryAttempts: number;
  providers: Record<string, any>;
}

export interface MongoConfig {
  uri: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    serverSelectionTimeoutMS: number;
    maxPoolSize: number;
  };
}
