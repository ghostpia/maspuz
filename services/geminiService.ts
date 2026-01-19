
import { GoogleGenAI } from "@google/genai";

// 깃허브 페이지 같은 정적 환경에서는 process.env가 없을 수 있습니다.
const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const getArtFact = async (artTitle: string): Promise<string> => {
  try {
    if (!apiKey) {
      console.warn("API Key is missing. Gemini features are disabled.");
      return "The Mona Lisa's expression has fascinated viewers for centuries.";
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a single, fascinating, one-sentence secret or fact about the painting "${artTitle}" that most people don't know. Keep it engaging for a museum game audience.`,
    });
    return response.text?.trim() || "The Mona Lisa is the most famous portrait in the world.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Mona Lisa's expression has fascinated viewers for centuries.";
  }
};
