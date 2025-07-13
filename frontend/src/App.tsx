import React, { useState, useEffect } from "react";
import { SmartSearchResponse, PromptHistory, LoadingState } from "./types";
import { useApi } from "./hooks/useApi";
import LoadingSpinner from "./components/LoadingSpinner";
import SmartResponse from "./components/SmartResponse";
import ErrorAlert from "./components/ErrorAlert";
import SearchSettings from "./components/SearchSettings";

function App() {
  // Form state
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<SmartSearchResponse | null>(null);
  const [history, setHistory] = useState<PromptHistory[]>([]);

  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    type: null,
  });

  // Search settings
  const [searchLimit, setSearchLimit] = useState(5);
  const [searchThreshold, setSearchThreshold] = useState(0.7);

  // API hooks
  const { smartSearch, getPrompts, error, clearError } = useApi();

  // Handle smart search submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoadingState({ isLoading: true, type: "search" });
    setResponse(null);
    clearError();

    try {
      const result = await smartSearch({
        query: prompt.trim(),
        limit: searchLimit,
        threshold: searchThreshold,
      });

      if (result.data) {
        setResponse(result.data);
        // Refresh history after successful search
        fetchHistory();
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoadingState({ isLoading: false, type: null });
    }
  };

  // Fetch prompt history
  const fetchHistory = async () => {
    setLoadingState({ isLoading: true, type: "history" });

    try {
      const result = await getPrompts();
      if (result.data) {
        setHistory(result.data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoadingState({ isLoading: false, type: null });
    }
  };

  // Load history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle source click
  const handleSourceClick = (source: PromptHistory) => {
    setPrompt(source.prompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear form
  const handleClear = () => {
    setPrompt("");
    setResponse(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Prompt Application
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ask questions and get intelligent responses powered by vector search
            and AI analysis of our knowledge base.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert error={error} onDismiss={clearError} className="mb-6" />
        )}

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What would you like to know?
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors placeholder-gray-400"
                placeholder="Type your question or prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loadingState.isLoading}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SearchSettings
                  limit={searchLimit}
                  threshold={searchThreshold}
                  onLimitChange={setSearchLimit}
                  onThresholdChange={setSearchThreshold}
                  isOpen={showSettings}
                  onToggle={() => setShowSettings(!showSettings)}
                />

                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={loadingState.isLoading}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear
                </button>
              </div>

              <button
                type="submit"
                disabled={loadingState.isLoading || !prompt.trim()}
                className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 ${
                  loadingState.isLoading || !prompt.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {loadingState.isLoading && loadingState.type === "search" ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Smart Response */}
        {response && (
          <SmartResponse
            response={response}
            query={prompt}
            onSourceClick={handleSourceClick}
          />
        )}

        {/* History Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Prompt History
            </h2>

            <div className="flex items-center space-x-3">
              {loadingState.isLoading && loadingState.type === "history" && (
                <LoadingSpinner size="sm" text="Loading..." />
              )}

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                {showHistory ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                    Hide History
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show History ({history.length})
                  </>
                )}
              </button>

              <button
                onClick={fetchHistory}
                disabled={loadingState.isLoading}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh history"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {history.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No prompt history available
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Start by asking a question above
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {history.map((item, index) => (
                    <div
                      key={item._id}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => handleSourceClick(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              #{history.length - index}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                            {item.embedding && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                                AI Ready
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              Prompt:{" "}
                            </span>
                            <span className="text-sm text-gray-700">
                              {item.prompt}
                            </span>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Response:{" "}
                            </span>
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {item.response}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by OpenAI embeddings and intelligent vector search
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
