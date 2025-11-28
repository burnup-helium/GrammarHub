
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigModal } from './components/ConfigModal';
import { AnalysisView } from './components/AnalysisView';
import { TranscriptionView } from './components/TranscriptionView';
import { AppSettings, AppState, AnalysisResult } from './types';
import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE_MB } from './constants';
import { analyzeGrammar } from './services/geminiService';
import { uploadAudioFile, saveAnalysisRecord } from './services/supabaseService';
import { UploadCloud, Loader2, FileAudio, AlertCircle, FileText, Download } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configWarning, setConfigWarning] = useState<string | null>(null);
  
  // Data State
  const [currentFile, setCurrentFile] = useState<{file: File, storagePath: string} | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Worker State
  const worker = useRef<Worker | null>(null);
  const [modelProgress, setModelProgress] = useState<{status: string, name: string, progress: number} | null>(null);

  // Load config from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('grammarhub_settings');
      if (saved) return JSON.parse(saved);
      return { url: '', anonKey: '', bucketName: 'audio-uploads', geminiApiKey: '' };
    } catch (e) {
      return { url: '', anonKey: '', bucketName: 'audio-uploads', geminiApiKey: '' };
    }
  });

  // Initialize Worker
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
      });
      
      worker.current.addEventListener('message', (e) => {
        const { status, result, error, data } = e.data;
        if (status === 'progress') {
            // data format from transformers.js: { status: 'progress', name: 'model.onnx', file: '...', progress: 0-100 }
            if (data.status === 'progress') {
                setModelProgress({ status: data.status, name: data.file, progress: data.progress });
            }
        } else if (status === 'ready') {
            // Model loaded
        } else if (status === 'complete') {
            setTranscriptionText(result);
            setAppState(AppState.TRANSCRIPTION_REVIEW);
            setModelProgress(null);
        } else if (status === 'error') {
            setAppState(AppState.ERROR);
            setErrorMsg(`Transcription Error: ${error}`);
            setModelProgress(null);
        }
      });
    }
    return () => worker.current?.terminate();
  }, []);

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
    await startProcess(file);
  };

  // STEP 1: Upload and Transcribe (Locally)
  const startProcess = async (file: File) => {
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

    if (!settings.url || !settings.anonKey) {
        setConfigWarning("Please configure Supabase details to continue.");
        setConfigModalOpen(true);
        return;
    }
    
    // Note: We don't strictly enforce Gemini Key here anymore for Step 1, 
    // but we will need it for Step 2.

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
          friendlyError = `Permission denied: Check Supabase RLS Policies.`;
        }
        setErrorMsg(`Upload failed: ${friendlyError}`);
        setAppState(AppState.IDLE);
        return;
      }

      setCurrentFile({ file, storagePath });

      // 2. Transcribe Locally using Worker
      setAppState(AppState.TRANSCRIBING);
      
      // Create a blob URL for the worker to process
      const audioUrl = URL.createObjectURL(file);
      
      // Send to worker
      worker.current?.postMessage({
        type: 'transcribe',
        audio: audioUrl
      });

    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
      setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  // STEP 2: Analyze Grammar (triggered by user from TranscriptionView)
  const handleProceedToAnalysis = async (finalText: string) => {
    if (!currentFile) return;
    
    if (!settings.geminiApiKey) {
        setConfigWarning("Gemini API Key is required for Step 2 (Analysis).");
        setConfigModalOpen(true);
        return;
    }

    try {
      setAppState(AppState.ANALYZING);

      // 3. Extract Grammar using Gemini (Uses Tokens, but small text amount)
      const grammarData = await analyzeGrammar(finalText, settings.geminiApiKey);

      const fullResult: AnalysisResult = {
        transcription: finalText,
        ...grammarData
      };

      // 4. Save Record to Supabase
      await saveAnalysisRecord(currentFile.file.name, currentFile.storagePath, fullResult, settings);

      setAnalysisResult(fullResult);
      setAppState(AppState.SUCCESS);

    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed.");
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setTranscriptionText("");
    setCurrentFile(null);
    setModelProgress(null);
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
                Upload an MP3, WAV or M4A file.<br/>
                <span className="text-blue-600 font-medium">Free Local Transcription</span> + AI Analysis.
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
                <span>Run locally (Whisper)</span>
                <span>•</span>
                <span>Save to Supabase</span>
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
            <h3 className="text-lg font-medium text-gray-700">Uploading to Storage...</h3>
          </div>
        );

      case AppState.TRANSCRIBING:
        return (
          <div className="flex flex-col items-center justify-center mt-32 px-4 text-center">
            {modelProgress ? (
                <>
                  <div className="mb-4 relative">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">Loading Whisper Model...</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-md">
                     Downloading model to your browser (one-time only).
                     <br/>
                     <span className="font-mono text-xs">{modelProgress.name}: {Math.round(modelProgress.progress)}%</span>
                  </p>
                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${modelProgress.progress}%` }}
                    />
                  </div>
                </>
            ) : (
                <>
                  <div className="animate-pulse mb-4">
                    <FileAudio className="w-12 h-12 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">Transcribing locally...</h3>
                  <p className="text-gray-500 text-sm mt-2">Running Whisper in your browser. This uses your CPU.</p>
                </>
            )}
          </div>
        );

      case AppState.TRANSCRIPTION_REVIEW:
        return (
          <TranscriptionView 
            transcription={transcriptionText} 
            onAnalyze={handleProceedToAnalysis}
            onCancel={resetApp}
          />
        );

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center mt-32">
            <div className="animate-spin mb-4">
              <Loader2 className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Extracting Grammar Points...</h3>
            <p className="text-gray-500 text-sm mt-2">Gemini is analyzing the text syntax and context.</p>
            <div className="mt-6 bg-white border border-gray-200 rounded px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
               <FileText className="w-4 h-4" />
               <span>Processing text analysis</span>
            </div>
          </div>
        );

      case AppState.SUCCESS:
        return analysisResult ? (
          <AnalysisView 
            result={analysisResult} 
            onReset={resetApp} 
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
