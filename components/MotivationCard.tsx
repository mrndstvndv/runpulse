
import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { RefreshIcon, AiBrain02Icon } from '@hugeicons/core-free-icons';

interface MotivationCardProps {
  message: string;
  loading: boolean;
  onRefresh: () => void;
  disabled?: boolean;
}

const MotivationCard: React.FC<MotivationCardProps> = ({ message, loading, onRefresh, disabled }) => {
  return (
    <div className="w-full max-w-md bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 rounded-3xl border border-indigo-500/30 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2">
        <button 
          onClick={onRefresh}
          disabled={loading || disabled}
          className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <HugeiconsIcon icon={RefreshIcon} size={20} color="currentColor" strokeWidth={2} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="bg-indigo-500/20 p-2 rounded-xl">
           <HugeiconsIcon icon={AiBrain02Icon} size={24} color="#818cf8" strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-tighter text-indigo-300 mb-1">AI Coach</h4>
          <p className="italic text-zinc-100 leading-relaxed font-medium">
            {loading ? "Generating motivation..." : `"${message}"`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MotivationCard;
