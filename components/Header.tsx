import React from 'react';
import { Mic, Settings, Github } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="bg-[#24292f] text-white py-4 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Github className="w-8 h-8" />
        <div>
          <h1 className="text-lg font-bold leading-tight">GrammarHub</h1>
          <p className="text-xs text-gray-400">Audio Analysis for Teachers</p>
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-300 hover:text-white flex items-center gap-2 text-sm"
      >
        <Settings className="w-4 h-4" />
        <span>Config</span>
      </button>
    </header>
  );
};