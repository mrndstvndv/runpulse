
export enum WorkoutMode {
  JOG = 'JOG',
  REST = 'REST',
  WARMUP = 'WARMUP',
  COOLDOWN = 'COOLDOWN'
}

export interface VoiceSettings {
  apiKey: string;
  enabled: boolean;
  voiceId: string;
  volume: number;
  charsUsedThisMonth: number;
  lastResetDate: string;
}

export interface AICoachSettings {
  apiKey: string;
  enabled: boolean;
  systemPrompt: string;
}

export interface WorkoutSettings {
  jogDuration: number;
  restDuration: number;
  rounds: number;
  voice: VoiceSettings;
  aiCoach: AICoachSettings;
}

export interface WorkoutHistoryEntry {
  id: string;
  timestamp: number;
  mode: WorkoutMode;
  duration: number;
}

export const JESSICA_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

export const defaultVoiceSettings: VoiceSettings = {
  apiKey: '',
  enabled: false,
  voiceId: JESSICA_VOICE_ID,
  volume: 0.8,
  charsUsedThisMonth: 0,
  lastResetDate: new Date().toISOString().slice(0, 7),
};

export const defaultAiCoachSettings: AICoachSettings = {
  apiKey: '',
  enabled: true,
  systemPrompt:
    "Give short, casual motivation (max 15 words). Warm, supportive, slightly playful. No clichés or labels.",
};

export const defaultWorkoutSettings: Omit<WorkoutSettings, 'voice' | 'aiCoach'> = {
  jogDuration: 360,
  restDuration: 120,
  rounds: 5,
};
