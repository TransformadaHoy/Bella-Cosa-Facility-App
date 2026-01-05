
import { GoogleGenAI } from "@google/genai";

// Initialize with direct API key from process.env following guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateNote = async (text: string): Promise<string> => {
  if (!text || text.trim().length < 2) return text;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following maintenance note from Spanish to professional, technical English for a General Manager report. Return ONLY the translation text: "${text}"`,
      config: {
        temperature: 0.1,
        topP: 0.95,
      }
    });
    
    // Accessing .text as a property, not a method, as per guidelines
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
