import React from 'react';
import { 
  PowerOff, 
  RotateCcw, 
  Play, 
  Database, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface CrashRecoveryBannerProps {
  isCrashed: boolean;
  canResume: boolean;
  lastCompletedStep: number;
  duplicatePreventedCount: number;
  onResume: () => void;
  onRollback: () => void;
}

export const CrashRecoveryBanner: React.FC<CrashRecoveryBannerProps> = ({
  isCrashed,
  canResume,
  lastCompletedStep,
  duplicatePreventedCount,
  onResume,
  onRollback,
}) => {
  if (!isCrashed && duplicatePreventedCount === 0) return null;

  if (duplicatePreventedCount > 0 && !isCrashed) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">
              Idempotency Guard Active: Duplicate Side Effect Prevented!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Recovered previous durable checkpoint without re-charging card or repeating hotel holds ({duplicatePreventedCount} duplicate calls suppressed).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-purple-50/95 dark:bg-purple-950/90 border-2 border-purple-400 dark:border-purple-600 shadow-xl space-y-4 animate-in slide-in-from-top-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md animate-pulse shrink-0">
            <PowerOff className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded">
                SIMULATED CRASH DETECTED
              </span>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                Host Terminated After Step {lastCompletedStep}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Durable Execution Log Preserved State Checkpoint
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResume}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume (No Duplicate Side Effects)</span>
          </button>

          <button
            onClick={onRollback}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback After Crash</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-3 border-t border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200">
        <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/60 dark:border-purple-800/60">
          <span className="font-bold block text-[10px] text-purple-500 uppercase">1. Durable Log</span>
          <span>Checkpointed Steps 1..{lastCompletedStep} saved</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/60 dark:border-purple-800/60">
          <span className="font-bold block text-[10px] text-purple-500 uppercase">2. Idempotency</span>
          <span>Previous tokens prevent double-charging</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/60 dark:border-purple-800/60">
          <span className="font-bold block text-[10px] text-purple-500 uppercase">3. Resumption</span>
          <span>Starts directly at Step {lastCompletedStep + 1}</span>
        </div>
      </div>
    </div>
  );
};
