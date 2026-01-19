
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getArtFact = async (artTitle: string): Promise<string> => {
  try {
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
