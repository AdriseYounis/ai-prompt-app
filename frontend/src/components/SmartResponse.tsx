import React from 'react';
import { SmartSearchResponse } from '../types';

interface SmartResponseProps {
  response: SmartSearchResponse;
  query: string;
  onSourceClick?: (source: any) => void;
}

const SmartResponse: React.FC<SmartResponseProps> = ({
  response,
  query,
  onSourceClick
}) => {
  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Response
              </h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                Based on {response.sources.length} source{response.sources.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="prose prose-gray max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {response.response}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Section */}
      {response.sources.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Related Sources
          </h4>

          <div className="space-y-3">
            {response.sources.map((source, index) => (
              <div
                key={source._id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSourceClick?.(source)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {((response.similarity_scores[index] || 0) * 100).toFixed(1)}% match
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {source.prompt}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {source.response}
                    </p>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Information */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <span className="font-medium">Search Query:</span> "{query}"
      </div>
    </div>
  );
};

export default SmartResponse;
