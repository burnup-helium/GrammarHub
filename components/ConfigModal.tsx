import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save, AlertTriangle, ShieldAlert, Key } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppSettings;
  onSave: (config: AppSettings) => void;
  message?: string | null;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, onSave, message }) => {
  const [localConfig, setLocalConfig] = useState<AppSettings>(config);

  useEffect(() => {
    if (isOpen) setLocalConfig(config);
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800">Application Configuration</h3>
            <p className="text-xs text-gray-500">Settings are saved in your browser</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          {message && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{message}</p>
            </div>
          )}

          {/* Gemini Section */}
          <div className="border-b border-gray-100 pb-4 mb-4">
             <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-700">AI Model Settings</h4>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  name="geminiApiKey"
                  value={localConfig.geminiApiKey}
                  onChange={handleChange}
                  placeholder="AIzaSy..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-shadow"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a>.
                </p>
             </div>
          </div>

          {/* Supabase Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-bold text-gray-700">Storage Settings (Supabase)</h4>
             </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                <input
                  type="text"
                  name="url"
                  value={localConfig.url}
                  onChange={handleChange}
                  placeholder="https://your-project.supabase.co"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anon Public Key</label>
                <input
                  type="password"
                  name="anonKey"
                  value={localConfig.anonKey}
                  onChange={handleChange}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Bucket Name</label>
                <input
                  type="text"
                  name="bucketName"
                  value={localConfig.bucketName}
                  onChange={handleChange}
                  placeholder="audio-uploads"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow"
                />
                <div className="mt-2 text-[10px] text-gray-400 leading-tight">
                  Ensure you have an RLS Policy on this bucket allowing <strong>INSERT</strong> for <strong>anon</strong> users.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 flex-shrink-0">
           <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#2da44e] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2c974b] transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};