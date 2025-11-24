
import React, { useState } from 'react';
import { MessageSquare, ArrowRight, RefreshCw, PenLine } from 'lucide-react';

interface TranscriptionViewProps {
  transcription: string;
  onAnalyze: (finalText: string) => void;
  onCancel: () => void;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onAnalyze, onCancel }) => {
  const [text, setText] = useState(transcription);

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Review Transcription</h2>
        <p className="text-gray-500 mt-2">
          Gemini has transcribed the audio. Please check for errors before extracting grammar points.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-700">Transcript</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <PenLine className="w-3 h-3" />
            <span>Editable</span>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 p-4 text-gray-800 leading-relaxed font-mono text-sm outline-none resize-none focus:bg-blue-50/30 transition-colors"
          placeholder="Transcription will appear here..."
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Start Over
        </button>
        
        <button
          onClick={() => onAnalyze(text)}
          className="flex-1 bg-purple-600 text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span>Extract Grammar Points</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
