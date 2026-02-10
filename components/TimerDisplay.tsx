
import React from 'react';
import { WorkoutMode } from '../types';

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime: number;
  mode: WorkoutMode;
  isRunning: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeRemaining, totalTime, mode, isRunning }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const percentage = (timeRemaining / totalTime) * 100;
  // Circumference for r=85 is 2 * PI * 85 ≈ 534
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const modeColors = {
    [WorkoutMode.JOG]: 'text-orange-500',
    [WorkoutMode.REST]: 'text-cyan-400',
    [WorkoutMode.WARMUP]: 'text-yellow-400',
    [WorkoutMode.COOLDOWN]: 'text-purple-400',
  };

  const ringColors = {
    [WorkoutMode.JOG]: 'stroke-orange-500',
    [WorkoutMode.REST]: 'stroke-cyan-400',
    [WorkoutMode.WARMUP]: 'stroke-yellow-400',
    [WorkoutMode.COOLDOWN]: 'stroke-purple-400',
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-80 h-80">
      {/* Outer Pulse Ring */}
      {isRunning && (
        <div className={`absolute inset-0 rounded-full border-2 ${ringColors[mode].replace('stroke', 'border')} opacity-20 animate-pulse-ring`} />
      )}
      
      {/* Progress Ring SVG */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-zinc-900"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ 
            strokeDashoffset, 
            transition: 'stroke-dashoffset 0.5s ease-out',
            strokeLinecap: 'round'
          }}
          className={`${ringColors[mode]}`}
        />
      </svg>

      {/* Timer Text Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`text-xs font-black tracking-[0.2em] uppercase mb-1 ${modeColors[mode]}`}>
          {mode}
        </span>
        <span className="timer-font text-5xl font-bold tracking-tight text-white">
          {String(minutes).padStart(2, '0')}<span className="opacity-50 text-4xl">:</span>{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default TimerDisplay;
