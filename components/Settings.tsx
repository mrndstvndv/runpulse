import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon } from '@hugeicons/core-free-icons';
import { WorkoutSettings } from '../types';

interface SettingsProps {
  settings: WorkoutSettings;
  onUpdate: (newSettings: WorkoutSettings) => void;
  disabled?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, disabled }) => {
  const handleChange = (field: keyof Omit<WorkoutSettings, 'voice' | 'aiCoach'>, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onUpdate({ ...settings, [field]: numValue });
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Settings01Icon} size={20} color="currentColor" strokeWidth={2} />
          Workout Settings
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Jog Duration (seconds)</label>
            <input
              type="number"
              value={settings.jogDuration}
              onChange={(e) => handleChange('jogDuration', e.target.value)}
              disabled={disabled}
              className="bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Rest Duration (seconds)</label>
            <input
              type="number"
              value={settings.restDuration}
              onChange={(e) => handleChange('restDuration', e.target.value)}
              disabled={disabled}
              className="bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Rounds</label>
            <input
              type="number"
              value={settings.rounds}
              onChange={(e) => handleChange('rounds', e.target.value)}
              disabled={disabled}
              className="bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-white outline-none transition-all disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
