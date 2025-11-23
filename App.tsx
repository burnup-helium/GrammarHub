import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigModal } from './components/ConfigModal';
import { AnalysisView } from './components/AnalysisView';
import { AppSettings, AppState, AnalysisResult } from './types';
import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE_MB } from './constants';
import { fileToBase64, formatBytes } from './utils/fileHelpers';
import { analyzeAudio } from './services/geminiService';
import { uploadAudioFile, saveAnalysisRecord } from './services/supabaseService';
import { UploadCloud, Loader2, FileAudio, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configWarning, setConfigWarning] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Load config from localStorage on initial render
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('grammarhub_settings');
      if (saved) return JSON.parse(saved);
      
      // Try legacy key if exists
      const legacy = localStorage.getItem('grammarhub_supabase_config');
      if (legacy) {
         const legObj = JSON.parse(legacy);
         return { ...legObj, geminiApiKey: '' };
      }
      
      return {
        url: '',
        anonKey: '',
        bucketName: 'audio-uploads',
        geminiApiKey: ''
      };
    } catch (e) {
      return { url: '', anonKey: '', bucketName: 'audio-uploads', geminiApiKey: '' };
    }
  });

  const handleSaveConfig = (newConfig: AppSettings) => {
    setSettings(newConfig);
    localStorage.setItem('grammarhub_settings', JSON.stringify(newConfig));
    setErrorMsg(null);
    setConfigWarning(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setConfigWarning(null);

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setErrorMsg(`Invalid file type. Allowed: MP3, WAV, M4A, OGG.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Check configuration strictly
    if (!settings.url || !settings.anonKey || !settings.geminiApiKey) {
        setConfigWarning("Please configure Supabase details AND Gemini API Key to continue.");
        setConfigModalOpen(true);
        return;
    }

    try {
      setAppState(AppState.UPLOADING);

      // 1. Upload to Supabase
      let storagePath = '';
      try {
        const path = await uploadAudioFile(file, settings);
        if (path) storagePath = path;
      } catch (e: any) {
        console.error("Upload failed", e);
        
        let friendlyError = e.message || "Unknown error";
        if (friendlyError.includes("violate") || friendlyError.includes("policy")) {
          friendlyError = `Permission denied: ${friendlyError}. Check your Storage RLS Policies.`;
        } else if (friendlyError.includes("bucket")) {
           friendlyError = `Bucket error: ${friendlyError}. Does bucket '${settings.bucketName}' exist?`;
        }

        setErrorMsg(`Upload failed: ${friendlyError}`);
        setAppState(AppState.IDLE);
        return;
      }

      // 2. Analyze with Gemini
      setAppState(AppState.ANALYZING);
      const base64Audio = await fileToBase64(file);
      
      // Pass the API Key from settings
      const result = await analyzeAudio(base64Audio, file.type, settings.geminiApiKey);

      // 3. Save metadata to Supabase
      await saveAnalysisRecord(file.name, storagePath, result, settings);

      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);

    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
      setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
      case AppState.ERROR:
        return (
          <div className="max-w-2xl mx-auto mt-16">
            <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Classroom Audio</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Upload an MP3, WAV or M4A file. We'll transcribe it and extract grammar points.
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={ALLOWED_AUDIO_TYPES.join(',')}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#2da44e] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#2c974b] transition-colors shadow-sm active:scale-95 transform"
              >
                Choose Audio File
              </button>

              <div className="mt-6 flex justify-center gap-6 text-xs text-gray-400">
                <span>Max {MAX_FILE_SIZE_MB}MB</span>
                <span>•</span>
                <span>Secure Supabase Storage</span>
                <span>•</span>
                <span>Powered by Gemini 2.5</span>
              </div>

              {errorMsg && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex flex-col items-center gap-1 animate-in fade-in text-center">
                  <div className="flex items-center gap-2 font-semibold">
                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
                     <span>Error</span>
                  </div>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        );

      case AppState.UPLOADING:
        return (
          <div className="flex flex-col items-center justify-center mt-32">
            <div className="animate-bounce mb-4">
              <UploadCloud className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Uploading to Supabase...</h3>
            <p className="text-gray-500 text-sm mt-2">Saving file to your storage bucket.</p>
          </div>
        );

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center mt-32">
            <div className="animate-spin mb-4">
              <Loader2 className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Analyzing Conversation...</h3>
            <p className="text-gray-500 text-sm mt-2">Gemini is transcribing and identifying grammar points.</p>
            <div className="mt-6 bg-white border border-gray-200 rounded px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
               <FileAudio className="w-4 h-4" />
               <span>Model: gemini-2.5-flash</span>
            </div>
          </div>
        );

      case AppState.SUCCESS:
        return analysisResult ? (
          <AnalysisView 
            result={analysisResult} 
            onReset={() => {
              setAppState(AppState.IDLE);
              setAnalysisResult(null);
            }} 
          />
        ) : null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenSettings={() => {
        setConfigWarning(null);
        setConfigModalOpen(true);
      }} />
      
      <main className="flex-1 p-6">
        {renderContent()}
      </main>

      <ConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={settings}
        onSave={handleSaveConfig}
        message={configWarning}
      />
    </div>
  );
};

export default App;