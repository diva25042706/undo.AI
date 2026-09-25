import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../../context/AgentContext';
import { RotateCcw, Loader2, Command, Sparkles } from 'lucide-react';

export const GlobalUndoButton: React.FC = () => {
  const { undoLastAction, stats } = useAgent();
  const [isUndoing, setIsUndoing] = useState(false);

  const handleGlobalUndo = async () => {
    if (isUndoing || stats.safeToUndoCount === 0) return;
    setIsUndoing(true);
    await undoLastAction();
    setIsUndoing(false);
  };

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="relative group"
      >
        <button
          disabled={isUndoing || stats.safeToUndoCount === 0}
          onClick={handleGlobalUndo}
          className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-200 border ${
            stats.safeToUndoCount > 0
              ? 'bg-linear-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white border-rose-400/40 shadow-rose-600/30 glow-danger'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-75'
          }`}
        >
          {isUndoing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
          )}

          <span>{isUndoing ? 'Undoing Last Action...' : 'Undo Last Action'}</span>

          {/* Shortcut Key Badge */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/20 text-white/90 text-[10px] font-mono ml-1 border border-white/20">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>Z</span>
          </div>

          {stats.safeToUndoCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        {/* Informative Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block pointer-events-none z-50">
          <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700 w-64 text-left">
            <p className="font-bold flex items-center gap-1 text-rose-400">
              <RotateCcw className="w-3.5 h-3.5" /> Agent Rollback Engine
            </p>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Instantly reverses the last autonomous AI action and restores previous checkpoint state.
            </p>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Reversible Stack:</span>
              <span className="text-emerald-400 font-bold">{stats.safeToUndoCount} actions available</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
