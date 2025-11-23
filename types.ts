export interface GrammarPoint {
  title: string;
  explanation: string;
  example: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface AnalysisResult {
  transcription: string;
  grammarPoints: GrammarPoint[];
  summary: string;
}

export interface AppSettings {
  url: string;
  anonKey: string;
  bucketName: string;
  geminiApiKey: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}