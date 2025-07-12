import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/prompt", {
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200
              ${
                loading || !prompt.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700"
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
      </div>
    </div>
  );
}

export default App;
