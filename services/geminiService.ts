import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const grammarSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcription: {
      type: Type.STRING,
      description: "The full verbatim transcription of the audio.",
    },
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
  required: ["transcription", "summary", "grammarPoints"],
};

export const analyzeAudio = async (base64Audio: string, mimeType: string, apiKey: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `You are an expert linguistics teacher. 
            1. Listen to the audio carefully and provide a verbatim transcription.
            2. Identify 3 to 5 distinct, learnable grammar points or useful expressions appearing in this dialogue.
            3. Format the output strictly as JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: grammarSchema,
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text) as AnalysisResult;
      return result;
    } else {
      throw new Error("No response text received from Gemini.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};