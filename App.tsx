
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkoutMode, WorkoutSettings, defaultAiCoachSettings, defaultVoiceSettings } from './types';
import TimerDisplay from './components/TimerDisplay';
import Settings from './components/Settings';
import MotivationCard from './components/MotivationCard';
import CoachSettingsDialog from './components/CoachSettingsDialog';
import { getMotivationalCoachMessage } from './services/geminiService';
import { speak, shouldResetMonthly } from './services/elevenLabsService';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  HeartAddIcon,
  RotateLeft01Icon,
  PauseIcon,
  PlayIcon,
  NextIcon,
  VolumeHighIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';

const STORAGE_KEY = 'runpulse-settings';

const defaultSettings: WorkoutSettings = {
  jogDuration: 360,
  restDuration: 120,
  rounds: 5,
  voice: defaultVoiceSettings,
  aiCoach: defaultAiCoachSettings,
};

const loadSettings = (): WorkoutSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved);
    const settings: WorkoutSettings = {
      ...defaultSettings,
      ...parsed,
      voice: { ...defaultVoiceSettings, ...parsed?.voice },
      aiCoach: { ...defaultAiCoachSettings, ...parsed?.aiCoach },
    };
    // Check for monthly reset
    if (shouldResetMonthly(settings.voice.lastResetDate)) {
      settings.voice.charsUsedThisMonth = 0;
      settings.voice.lastResetDate = new Date().toISOString().slice(0, 7);
    }
    return settings;
  } catch {
    return defaultSettings;
  }
};

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<WorkoutSettings>(loadSettings);
  
  const [currentRound, setCurrentRound] = useState(1);
  const [mode, setMode] = useState<WorkoutMode>(WorkoutMode.JOG);
  const [timeRemaining, setTimeRemaining] = useState(settings.jogDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [motivation, setMotivation] = useState(
    settings.aiCoach.enabled ? "Tap 'Play' to start your journey!" : ''
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isCoachSettingsOpen, setIsCoachSettingsOpen] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // Beep Sound Utility
  const playSound = (freq: number, duration: number, volume: number = 0.1) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  };

  // Complex sound patterns
  const playStartJogSound = () => {
    playSound(880, 0.2, 0.15);
    setTimeout(() => playSound(1056, 0.4, 0.15), 150);
  };

  const playStartRestSound = () => {
    playSound(660, 0.5, 0.15);
  };

  const playCountdownPip = () => {
    playSound(440, 0.1, 0.05);
  };

  const setMotivationIfEnabled = useCallback((message: string) => {
    if (!settings.aiCoach.enabled) return;
    setMotivation(message);
  }, [settings.aiCoach.enabled]);

  const fetchMotivation = useCallback(async (currentMode: WorkoutMode, elapsed: number) => {
    if (!settings.aiCoach.enabled) return;
    setIsAiLoading(true);
    const msg = await getMotivationalCoachMessage(currentMode, elapsed, settings.aiCoach);
    setMotivationIfEnabled(msg);
    setIsAiLoading(false);
  }, [settings.aiCoach, setMotivationIfEnabled]);

  const trackVoiceUsage = useCallback((chars: number) => {
    setSettings((prev) => ({
      ...prev,
      voice: {
        ...prev.voice,
        charsUsedThisMonth: prev.voice.charsUsedThisMonth + chars,
      },
    }));
  }, []);

  const unlockAudio = () => {
    setAudioUnlocked(true);
  };

  // Refs to avoid dependency issues in TTS effect
  const voiceRef = useRef(settings.voice);
  const lastSpokenRef = useRef<string>('');
  
  useEffect(() => {
    voiceRef.current = settings.voice;
  }, [settings.voice]);

  useEffect(() => {
    if (settings.aiCoach.enabled) return;
    setIsAiLoading(false);
    setMotivation('');
  }, [settings.aiCoach.enabled]);

  // TTS Effect - speak motivation when it changes (only once per unique message)
  useEffect(() => {
    if (!settings.aiCoach.enabled) return;
    if (voiceRef.current.enabled && audioUnlocked && motivation && !isAiLoading && motivation !== lastSpokenRef.current) {
      lastSpokenRef.current = motivation;
      speak(motivation, voiceRef.current, trackVoiceUsage);
    }
  }, [motivation, audioUnlocked, isAiLoading, trackVoiceUsage, settings.aiCoach.enabled]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  // Timer Effect
  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeRemaining > 0) {
      interval = window.setInterval(() => {
        const nextTime = timeRemaining - 1;
        setTimeRemaining(nextTime);
        setTotalElapsed((prev) => prev + 1);

        // Countdown sounds for last 3 seconds
        if (nextTime <= 3 && nextTime > 0) {
          playCountdownPip();
        }
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      // Phase Switch Logic
      if (mode === WorkoutMode.JOG) {
        // Transitioning to REST
        playStartRestSound();
        setMode(WorkoutMode.REST);
        setTimeRemaining(settings.restDuration);
        fetchMotivation(WorkoutMode.REST, totalElapsed);
      } else {
        // Transitioning to JOG (Next Round)
        if (currentRound < settings.rounds) {
          playStartJogSound();
          setCurrentRound((prev) => prev + 1);
          setMode(WorkoutMode.JOG);
          setTimeRemaining(settings.jogDuration);
          fetchMotivation(WorkoutMode.JOG, totalElapsed);
        } else {
          // Workout Finished
          setIsRunning(false);
          const finishMsg = "Incredible work! You've finished the workout.";
          setMotivationIfEnabled(finishMsg);
          playSound(440, 1.0, 0.2);
          setTimeout(() => playSound(554, 1.0, 0.2), 200);
          setTimeout(() => playSound(659, 1.5, 0.2), 400);
          // TTS for workout complete
          if (settings.aiCoach.enabled && voiceRef.current.enabled && audioUnlocked && finishMsg !== lastSpokenRef.current) {
            lastSpokenRef.current = finishMsg;
            speak(finishMsg, voiceRef.current, trackVoiceUsage);
          }
        }
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, mode, currentRound, settings, totalElapsed, fetchMotivation, audioUnlocked, trackVoiceUsage, setMotivationIfEnabled]);

  const toggleTimer = () => {
    // Auto-unlock audio on user interaction
    if (!audioUnlocked) {
      setAudioUnlocked(true);
    }
    
    if (!isRunning) {
      // Initialize/Resume Audio Context on user gesture
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (totalElapsed === 0) {
        playStartJogSound();
        fetchMotivation(mode, totalElapsed);
      } else {
        playSound(660, 0.1);
      }
    } else {
      playSound(440, 0.1);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode(WorkoutMode.JOG);
    setTimeRemaining(settings.jogDuration);
    setCurrentRound(1);
    setTotalElapsed(0);
    setMotivationIfEnabled("Timer reset. Ready when you are!");
    lastSpokenRef.current = ''; // Reset so same message can play again
    playSound(330, 0.3);
  };

  const handleSettingsUpdate = (newSettings: WorkoutSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      setTimeRemaining(newSettings.jogDuration);
    }
  };

  const skipPhase = () => {
    setTimeRemaining(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-xl flex justify-between items-center mb-10 mt-2">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <HugeiconsIcon icon={HeartAddIcon} size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">RunPulse<span className="text-orange-500">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCoachSettingsOpen(true)}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            title="Coach Settings"
          >
            <HugeiconsIcon icon={Settings01Icon} size={20} color="currentColor" strokeWidth={2} className="text-zinc-300" />
          </button>
          <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 text-xs font-bold uppercase tracking-tight">
            Round <span className="text-orange-500">{currentRound}</span> / {settings.rounds}
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl flex flex-col items-center gap-10">
        {/* Timer Section */}
        <div className="flex flex-col items-center w-full">
          <TimerDisplay 
            timeRemaining={timeRemaining} 
            totalTime={mode === WorkoutMode.JOG ? settings.jogDuration : settings.restDuration} 
            mode={mode} 
            isRunning={isRunning} 
          />
          
          {/* Controls */}
          <div className="flex items-center gap-6 mt-12">
            <button 
              onClick={resetTimer}
              className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors group"
              title="Reset Workout"
            >
              <HugeiconsIcon icon={RotateLeft01Icon} size={24} color="currentColor" strokeWidth={2} className="text-zinc-400 group-hover:text-white transition-colors" />
            </button>
            
            <button 
              onClick={toggleTimer}
              className={`w-20 h-20 flex items-center justify-center rounded-3xl ${isRunning ? 'bg-zinc-100 text-zinc-950' : 'bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.4)]'} transform active:scale-90 transition-all duration-300`}
            >
              {isRunning ? (
                <HugeiconsIcon icon={PauseIcon} size={32} color="currentColor" strokeWidth={4} />
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={32} color="currentColor" strokeWidth={4} />
              )}
            </button>

            <button 
              className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors group"
              title="Skip Phase"
              onClick={skipPhase}
            >
              <HugeiconsIcon icon={NextIcon} size={24} color="currentColor" strokeWidth={2} className="text-zinc-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Voice Unlock Button */}
        {settings.voice.enabled && !audioUnlocked && (
          <button
            onClick={unlockAudio}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-full hover:bg-orange-500/30 transition-all animate-pulse"
          >
            <HugeiconsIcon icon={VolumeHighIcon} size={20} strokeWidth={2} />
            <span className="text-sm font-medium">Tap to Enable Voice Coach</span>
          </button>
        )}

        {/* Info & Motivation */}
        <div className="flex flex-col gap-6 w-full pb-10">
          {settings.aiCoach.enabled && (
            <MotivationCard 
              message={motivation} 
              loading={isAiLoading} 
              onRefresh={() => fetchMotivation(mode, totalElapsed)}
              disabled={!settings.aiCoach.apiKey}
            />
          )}
          <Settings 
            settings={settings} 
            onUpdate={handleSettingsUpdate} 
            disabled={isRunning} 
          />
        </div>
      </main>

      <CoachSettingsDialog
        isOpen={isCoachSettingsOpen}
        settings={settings}
        onUpdate={handleSettingsUpdate}
        onClose={() => setIsCoachSettingsOpen(false)}
      />

      {/* Footer Decoration */}
      <footer className="mt-auto pb-6 text-zinc-600 text-[10px] font-bold tracking-widest flex items-center gap-2 uppercase">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        System Online • Monitoring Bio-Data
      </footer>
    </div>
  );
};

export default App;
