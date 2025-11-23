export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm'
];

export const MAX_FILE_SIZE_MB = 20;

// Fallback mock data if needed, though we aim for real API usage
export const MOCK_RESULT = {
  transcription: "Example transcription...",
  grammarPoints: [],
  summary: "No data."
};