import { useState, useEffect } from "react";

interface PromptHistory {
  _id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error occurred while fetching response");
    } finally {
      setLoading(false);
    }
  };

  // Fetch prompt history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/prompts`);
        const data = await res.json();
        console.log("Fetched history:", data);

        if (Array.isArray(data)) {
          setHistory(data);
        } else {
          console.error("Invalid history format:", data);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [response]); // Reload history when a new response is received

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          AI Prompt Application
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="sr-only">
              Enter your prompt
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 ${
              loading || !prompt.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </form>

        {response && (
          <div className="mt-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Response:
            </h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm">
                {response}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Prompt History
            </h2>
            <button
              onClick={() => {
                console.log("Toggle history: ", !showHistory);
                setShowHistory(!showHistory);
              }}
              className="px-4 py-2 text-sm rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-500">No prompt history available.</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="mb-2">
                      <span className="font-medium text-gray-900">
                        Prompt:{" "}
                      </span>
                      <span className="text-gray-700">{item.prompt}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        Response:{" "}
                      </span>
                      <span className="text-gray-700">{item.response}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
