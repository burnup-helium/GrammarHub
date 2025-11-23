import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, AnalysisResult } from '../types';

let supabase: SupabaseClient | null = null;
let currentConfigStr: string | null = null;

// Helper to get or initialize the client, ensuring it updates if config changes
const getSupabaseClient = (config: AppSettings) => {
  if (!config.url || !config.anonKey) return null;
  
  // We only care about url and key for this check, not the bucket or gemini key
  const newConfigStr = JSON.stringify({ url: config.url, key: config.anonKey });
  
  if (!supabase || currentConfigStr !== newConfigStr) {
    try {
      supabase = createClient(config.url, config.anonKey);
      currentConfigStr = newConfigStr;
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }
  return supabase;
};

export const uploadAudioFile = async (file: File, config: AppSettings): Promise<string | null> => {
  const client = getSupabaseClient(config);
  if (!client) throw new Error("Supabase client could not be initialized. Check your URL and Key.");

  // Sanitize filename: remove non-ascii, spaces, special chars
  const sanitizedName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  const filePath = `${Date.now()}_${sanitizedName}`;

  const { data, error } = await client.storage
    .from(config.bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    
    // Enhance error message for common RLS issues
    if (error.message.includes('row-level security') || error.message.includes('policy') || (error as any).statusCode === '42501') {
      throw new Error(`Access Denied (RLS Policy). Go to Supabase > Storage > Policies, and add a policy to allow 'anon' users to INSERT into '${config.bucketName}'.`);
    }
    
    throw new Error(error.message);
  }

  return data?.path || null;
};

export const saveAnalysisRecord = async (
  filename: string, 
  storagePath: string, 
  analysis: AnalysisResult,
  config: AppSettings
) => {
  const client = getSupabaseClient(config);
  if (!client) return;

  const { error } = await client
    .from('audio_analyses')
    .insert([
      {
        filename: filename,
        storage_path: storagePath,
        transcription: analysis.transcription,
        grammar_data: analysis.grammarPoints,
        created_at: new Date().toISOString(),
      }
    ]);

  if (error) {
    console.warn("Could not save to database (Table 'audio_analyses' might not exist or RLS policy blocks insert):", error.message);
  }
};