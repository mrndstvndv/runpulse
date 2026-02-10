
import { GoogleGenAI } from "@google/genai";
import { WorkoutMode, AICoachSettings } from "../types";

const buildPrompt = (mode: WorkoutMode, timeElapsed: number, systemPrompt: string): string => {
  return `System: ${systemPrompt}

Context: The user is working out. Mode: ${mode}. Time elapsed: ${Math.floor(timeElapsed / 60)} minutes.

If REST: low-key acknowledgment they need a breather.
If JOG: quiet confidence that they're doing something impressive.`;
};

export const getMotivationalCoachMessage = async (
  mode: WorkoutMode,
  timeElapsed: number,
  aiCoach: AICoachSettings
): Promise<string> => {
  if (!aiCoach.enabled) {
    return "AI coach is disabled. Enable it in settings.";
  }

  if (!aiCoach.apiKey) {
    return "Add your AI coach API key in settings to get motivation.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: aiCoach.apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: buildPrompt(mode, timeElapsed, aiCoach.systemPrompt),
      config: {
        temperature: 0.9,
      },
    });
    return response.text || "Keep pushing! You're doing great.";
  } catch (error) {
    console.error("Error getting motivation:", error);
    return "The only bad workout is the one that didn't happen.";
  }
};
