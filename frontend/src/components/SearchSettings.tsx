import React from 'react';

interface SearchSettingsProps {
  limit: number;
  threshold: number;
  onLimitChange: (limit: number) => void;
  onThresholdChange: (threshold: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SearchSettings: React.FC<SearchSettingsProps> = ({
  limit,
  threshold,
  onLimitChange,
  onThresholdChange,
  isOpen,
  onToggle
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        Search Settings
        <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between text-sm font-medium text-gray-900 border-b pb-2">
              <span>Search Configuration</span>
            </div>

            {/* Max Results */}
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
                Max Results: {limit}
              </label>
              <input
                type="range"
                id="limit"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => onLimitChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Similarity Threshold */}
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold: {(threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                id="threshold"
                min="0.1"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-3">
              <p className="mb-1">
                <strong>Max Results:</strong> Number of similar prompts to find
              </p>
              <p>
                <strong>Similarity Threshold:</strong> Minimum similarity percentage required
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                onLimitChange(5);
                onThresholdChange(0.7);
              }}
              className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSettings;
