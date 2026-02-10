import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Settings01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  TestTube01Icon,
  AiBrain02Icon,
} from '@hugeicons/core-free-icons';
import { WorkoutSettings } from '../types';
import { getQuotaStatus, shouldResetMonthly, testVoice } from '../services/elevenLabsService';

interface CoachSettingsDialogProps {
  isOpen: boolean;
  settings: WorkoutSettings;
  onUpdate: (newSettings: WorkoutSettings) => void;
  onClose: () => void;
  disabled?: boolean;
}

const CoachSettingsDialog: React.FC<CoachSettingsDialogProps> = ({
  isOpen,
  settings,
  onUpdate,
  onClose,
  disabled,
}) => {
  const [testing, setTesting] = useState(false);
  const [aiKeyVisible, setAiKeyVisible] = useState(false);
  const [voiceKeyVisible, setVoiceKeyVisible] = useState(false);

  if (!isOpen) return null;

  const handleAICoachChange = (field: keyof typeof settings.aiCoach, value: unknown) => {
    onUpdate({
      ...settings,
      aiCoach: {
        ...settings.aiCoach,
        [field]: value,
      },
    });
  };

  const handleVoiceChange = (field: keyof typeof settings.voice, value: unknown) => {
    const newVoice = { ...settings.voice, [field]: value };

    if (field === 'enabled' && value === true) {
      const needsReset = shouldResetMonthly(settings.voice.lastResetDate);
      if (needsReset) {
        newVoice.charsUsedThisMonth = 0;
        newVoice.lastResetDate = new Date().toISOString().slice(0, 7);
      }
    }

    onUpdate({ ...settings, voice: newVoice });
  };

  const handleTestVoice = async () => {
    setTesting(true);
    const success = await testVoice(settings.voice, (chars) => {
      handleVoiceChange('charsUsedThisMonth', settings.voice.charsUsedThisMonth + chars);
    });
    setTesting(false);
    if (!success) {
      alert('Failed to play test voice. Check your API key.');
    }
  };

  const quota = getQuotaStatus(settings.voice.charsUsedThisMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings01Icon} size={20} color="currentColor" strokeWidth={2} />
            <h2 className="text-lg font-semibold">Coach Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-300">
              <HugeiconsIcon icon={AiBrain02Icon} size={18} strokeWidth={2} />
              AI Coach
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.aiCoach.enabled}
                onChange={(e) => handleAICoachChange('enabled', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-indigo-400 focus:ring-indigo-400"
              />
              <span className="text-sm">Enable AI Coach</span>
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Gemini API Key</label>
              <div className="relative">
                <input
                  type={aiKeyVisible ? 'text' : 'password'}
                  value={settings.aiCoach.apiKey}
                  onChange={(e) => handleAICoachChange('apiKey', e.target.value)}
                  placeholder="AIza..."
                  disabled={disabled}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAiKeyVisible(!aiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {aiKeyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Create a key in Google AI Studio or Google Cloud Console.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Custom System Prompt</label>
              <textarea
                value={settings.aiCoach.systemPrompt}
                onChange={(e) => handleAICoachChange('systemPrompt', e.target.value)}
                disabled={disabled}
                rows={4}
                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 text-sm"
                placeholder="Describe the vibe, tone, and constraints for your AI coach."
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-orange-300">
              <HugeiconsIcon icon={settings.voice.enabled ? VolumeHighIcon : VolumeMute01Icon} size={18} strokeWidth={2} />
              Voice Coach
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voice.enabled}
                onChange={(e) => handleVoiceChange('enabled', e.target.checked)}
                disabled={disabled}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm">Enable Voice Coach (Jessica)</span>
            </label>

            {settings.voice.enabled && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">ElevenLabs API Key</label>
                  <div className="relative">
                    <input
                      type={voiceKeyVisible ? 'text' : 'password'}
                      value={settings.voice.apiKey}
                      onChange={(e) => handleVoiceChange('apiKey', e.target.value)}
                      placeholder="sk_..."
                      disabled={disabled}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setVoiceKeyVisible(!voiceKeyVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      {voiceKeyVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600">
                    Get your key from{' '}
                    <a
                      href="https://elevenlabs.io/app/settings/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline"
                    >
                      elevenlabs.io
                    </a>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Volume ({Math.round(settings.voice.volume * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.voice.volume}
                    onChange={(e) => handleVoiceChange('volume', parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-full accent-orange-500"
                  />
                </div>

                <button
                  onClick={handleTestVoice}
                  disabled={!settings.voice.apiKey || testing || disabled}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-colors"
                >
                  <HugeiconsIcon icon={TestTube01Icon} size={16} strokeWidth={2} />
                  {testing ? 'Testing...' : 'Test Voice'}
                </button>

                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Characters used this month</span>
                    <span className="font-mono">{settings.voice.charsUsedThisMonth.toLocaleString()} / 10,000</span>
                  </div>

                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${quota.color} transition-all duration-300`}
                      style={{ width: `${quota.percentUsed}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{quota.remaining.toLocaleString()} remaining</span>
                    <span>~{quota.estimatedWorkouts} workouts left</span>
                  </div>

                  <p className="text-xs text-zinc-600">Resets on {new Date().toISOString().slice(0, 7)}-01</p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CoachSettingsDialog;
