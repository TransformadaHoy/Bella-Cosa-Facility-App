
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the mandatory environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateNote = async (text: string): Promise<string> => {
  if (!text || text.trim().length < 2) return text;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following maintenance resolution note from Spanish to professional, technical English suitable for a General Manager report. Return ONLY the translated string: "${text}"`,
      config: {
        temperature: 0.1,
        topP: 0.95,
      }
    });
    
    // SDK Rule: Use .text property, not .text() method
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Translation error:", error);
    return text;
  }
};

export const generateBriefing = async (orders: any[]): Promise<string> => {
  if (!orders || orders.length === 0) return "No pending orders to analyze today.";

  const orderSummary = orders
    .filter(o => o.status !== 'COMPLETED')
    .map(o => `- [${o.priority}] ${o.title} at ${o.location}`)
    .slice(0, 15) // Limit context for token efficiency
    .join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the AI Operations Coach for Bella Cosa, a luxury venue. 
      Analyze these pending work orders and provide a short, executive daily briefing (max 3 sentences). 
      Identify critical risks or suggested priorities for the team.
      
      Orders Summary:\n${orderSummary}`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    
    // SDK Rule: Use .text property, not .text() method
    return response.text?.trim() || "Operations appear stable. Monitor high priority infrastructure.";
  } catch (error) {
    console.error("Gemini Briefing error:", error);
    return "Operations Coach is currently analyzing offline. Continue with standard protocols.";
  }
};
