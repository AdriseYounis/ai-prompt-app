export interface PromptHistory {
  _id: string;
  prompt: string;
  response: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SmartSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SmartSearchResponse {
  response: string;
  sources: PromptHistory[];
  similarity_scores: number[];
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  type: "search" | "save" | "history" | null;
}

export interface SimilarPrompt {
  document: PromptHistory;
  similarity_score: number;
  similarity_percentage: string;
}

export interface FindSimilarResponse {
  query: string;
  found_count: number;
  results: SimilarPrompt[];
}

export interface EmbeddingStats {
  totalPrompts: number;
  promptsWithEmbeddings: number;
  promptsWithoutEmbeddings: number;
  embedding_coverage: string;
}

export interface HealthCheck {
  status: string;
  openai_configured: boolean;
  database_connected: boolean;
  embedding_service: boolean;
  database_service: boolean;
  timestamp: string;
}
