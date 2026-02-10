import { VoiceSettings } from '../types';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

let currentAudio: HTMLAudioElement | null = null;

export const speak = async (
  text: string,
  voiceSettings: VoiceSettings,
  onCharsUsed: (count: number) => void
): Promise<boolean> => {
  if (!voiceSettings.enabled || !voiceSettings.apiKey) return false;
  if (!text.trim()) return false;

  // Wait for any current audio to finish
  if (currentAudio && !currentAudio.paused) {
    await new Promise<void>((resolve) => {
      if (currentAudio) {
        currentAudio.addEventListener('ended', () => resolve(), { once: true });
      } else {
        resolve();
      }
    });
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceSettings.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': voiceSettings.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', error);
      return false;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = voiceSettings.volume;
    
    await new Promise<void>((resolve, reject) => {
      if (!currentAudio) return reject();
      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      currentAudio.onerror = reject;
      currentAudio.play();
    });

    onCharsUsed(text.length);
    return true;
  } catch (error) {
    console.error('TTS error:', error);
    return false;
  }
};

export const stopSpeaking = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

export const testVoice = async (
  voiceSettings: VoiceSettings,
  onCharsUsed: (count: number) => void
): Promise<boolean> => {
  return speak("Hi, I'm Jessica. Ready to work out?", voiceSettings, onCharsUsed);
};

export const getQuotaStatus = (charsUsed: number): {
  percentUsed: number;
  remaining: number;
  estimatedWorkouts: number;
  color: string;
} => {
  const FREE_TIER_LIMIT = 10000;
  const percentUsed = Math.min((charsUsed / FREE_TIER_LIMIT) * 100, 100);
  const remaining = Math.max(FREE_TIER_LIMIT - charsUsed, 0);
  const estimatedWorkouts = Math.floor(remaining / 100); // ~100 chars per message
  
  let color = 'bg-green-500';
  if (percentUsed > 50) color = 'bg-yellow-500';
  if (percentUsed > 80) color = 'bg-red-500';
  
  return { percentUsed, remaining, estimatedWorkouts, color };
};

export const shouldResetMonthly = (lastResetDate: string): boolean => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return lastResetDate !== currentMonth;
};
