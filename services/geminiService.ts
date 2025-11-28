import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Schema for the second step (Grammar Analysis)
const grammarSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief summary of the conversation context.",
    },
    grammarPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Name of the grammar rule or concept." },
          explanation: { type: Type.STRING, description: "Clear explanation for a student." },
          example: { type: Type.STRING, description: "The snippet from the audio illustrating this point." },
          difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
        },
        required: ["title", "explanation", "example", "difficulty"],
      },
    },
  },
  required: ["summary", "grammarPoints"],
};

// NOTE: Transcription is now handled locally by Whisper in worker.ts to save tokens.
// Only Grammar Analysis uses Gemini.

// STEP 2: Analyze Grammar from Text
export const analyzeGrammar = async (transcription: string, apiKey: string): Promise<Omit<AnalysisResult, 'transcription'>> => {
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are an expert linguistics teacher. 
            Here is a transcription of a dialogue:
            """
            ${transcription}
            """
            
            1. Analyze this text for learning purposes.
            2. Identify 3 to 5 distinct, learnable grammar points or useful expressions appearing in this dialogue.
            3. Provide a brief summary.
            4. Format the output strictly as JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: grammarSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    } else {
      throw new Error("No analysis received from Gemini.");
    }
  } catch (error: any) {
    console.error("Grammar Analysis Error:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network Error: Unable to connect to Google API. Please check your VPN/Proxy.");
    }
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      throw new Error("Gemini Quota Exceeded (429). Please create a NEW API Key in a new Google Cloud Project to reset your free tier limit.");
    }
    throw error;
  }
};
