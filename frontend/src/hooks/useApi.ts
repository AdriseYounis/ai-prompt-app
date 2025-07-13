import { useState, useCallback } from "react";
import {
  SmartSearchRequest,
  SmartSearchResponse,
  PromptHistory,
  ApiError,
  FindSimilarResponse,
  EmbeddingStats,
  HealthCheck,
} from "../types";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

const API_BASE_URL = "/api";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(
    async <T>(apiCall: () => Promise<Response>): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall();

        // ----- 1. Handle HTTP error statuses up‑front -----
        if (!response.ok) {
          // Try to extract JSON error; fall back to plain text
          let errMsg = `HTTP ${response.status}`;
          const errText = await response.text();
          try {
            const errJson: ApiError = errText ? JSON.parse(errText) : {};
            errMsg = errJson.error || errJson.message || errMsg;
          } catch {
            if (errText) errMsg = errText;
          }
          throw new Error(errMsg);
        }

        // ----- 2. Read the body safely -----
        const raw = await response.text(); // never throws
        if (!raw) {
          // Empty body – treat as “no data”
          return { data: null, error: null, isLoading: false };
        }

        // ----- 3. Parse JSON if possible -----
        let data: T | null = null;
        try {
          data = JSON.parse(raw) as T;
        } catch (e) {
          throw new Error("Invalid JSON returned by API");
        }

        return { data, error: null, isLoading: false };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return { data: null, error: errorMessage, isLoading: false };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Smart search with AI response
  const smartSearch = useCallback(
    async (
      request: SmartSearchRequest,
    ): Promise<ApiResponse<SmartSearchResponse>> => {
      return handleApiCall<SmartSearchResponse>(async () => {
        return fetch(`${API_BASE_URL}/smart-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });
      });
    },
    [handleApiCall],
  );

  // Save prompt with embedding
  const saveSmartPrompt = useCallback(
    async (
      prompt: string,
      response: string,
    ): Promise<ApiResponse<{ id: string; message: string }>> => {
      return handleApiCall<{ id: string; message: string }>(async () => {
        return fetch(`${API_BASE_URL}/smart-prompt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, response }),
        });
      });
    },
    [handleApiCall],
  );

  // Find similar prompts (without AI response)
  const findSimilar = useCallback(
    async (
      request: SmartSearchRequest,
    ): Promise<ApiResponse<FindSimilarResponse>> => {
      return handleApiCall<FindSimilarResponse>(async () => {
        return fetch(`${API_BASE_URL}/find-similar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });
      });
    },
    [handleApiCall],
  );

  // Get all prompts (history)
  const getPrompts = useCallback(async (): Promise<
    ApiResponse<PromptHistory[]>
  > => {
    return handleApiCall<PromptHistory[]>(async () => {
      return fetch(`${API_BASE_URL}/prompts`);
    });
  }, [handleApiCall]);

  // Legacy prompt save (original endpoint)
  const savePrompt = useCallback(
    async (prompt: string): Promise<ApiResponse<{ response: string }>> => {
      return handleApiCall<{ response: string }>(async () => {
        return fetch(`${API_BASE_URL}/prompt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });
      });
    },
    [handleApiCall],
  );

  // Get embedding statistics
  const getEmbeddingStats = useCallback(async (): Promise<
    ApiResponse<EmbeddingStats>
  > => {
    return handleApiCall<EmbeddingStats>(async () => {
      return fetch(`${API_BASE_URL}/embedding-stats`);
    });
  }, [handleApiCall]);

  // Migrate embeddings
  const migrateEmbeddings = useCallback(async (): Promise<
    ApiResponse<{ message: string; updated_count: number }>
  > => {
    return handleApiCall<{ message: string; updated_count: number }>(
      async () => {
        return fetch(`${API_BASE_URL}/migrate-embeddings`, {
          method: "POST",
        });
      },
    );
  }, [handleApiCall]);

  // Health check
  const checkHealth = useCallback(async (): Promise<
    ApiResponse<HealthCheck>
  > => {
    return handleApiCall<HealthCheck>(async () => {
      return fetch(`${API_BASE_URL}/smart-health`);
    });
  }, [handleApiCall]);

  return {
    // State
    loading,
    error,

    // Methods
    smartSearch,
    saveSmartPrompt,
    findSimilar,
    getPrompts,
    savePrompt,
    getEmbeddingStats,
    migrateEmbeddings,
    checkHealth,

    // Utils
    clearError: () => setError(null),
  };
};

export default useApi;
