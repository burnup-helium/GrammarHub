import React from 'react';
import { AnalysisResult } from '../types';
import { BookOpen, MessageSquare, Info, CheckCircle2 } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Report</h2>
          <p className="text-gray-600">{result.summary}</p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:underline"
        >
          Analyze another file
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Transcription */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-sm text-gray-700">Transcription</h3>
            </div>
            <div className="p-4 bg-white max-h-[400px] overflow-y-auto text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm">
              {result.transcription}
            </div>
          </div>
        </div>

        {/* Right Column: Grammar Points */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">Grammar Points</h3>
          </div>
          
          {result.grammarPoints.map((point, index) => (
            <div key={index} className="border border-gray-200 rounded-lg bg-white shadow-sm p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-blue-600 text-sm">{point.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${point.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : 
                    point.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-700'}`}>
                  {point.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">{point.explanation}</p>
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <p className="text-xs text-gray-500 italic">"{point.example}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};