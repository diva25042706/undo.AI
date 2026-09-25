import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../../context/AgentContext';
import { RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export const UndoConfirmModal: React.FC = () => {
  const { selectedActionForUndo, setSelectedActionForUndo, undoAction } = useAgent();
  const [isRollingBack, setIsRollingBack] = useState(false);

  if (!selectedActionForUndo) return null;

  const action = selectedActionForUndo;

  const handleConfirmUndo = async () => {
    setIsRollingBack(true);
    const success = await undoAction(action.id);
    setIsRollingBack(false);
    if (success) {
      setSelectedActionForUndo(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Undo this action?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Action ID: <span className="font-mono font-semibold">{action.id}</span>
                </p>
              </div>
            </div>
            <RiskBadge risk={action.risk} size="sm" />
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            
            {/* Action Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Original Action
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {action.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Executed by {action.agentName} ({action.timeAgo})
                </p>
              </div>

              {/* State Transformation Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                    Current State
                  </span>
                  <p className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-1 break-all">
                    {action.newStateDesc || action.destPath || action.target}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    After Undo
                  </span>
                  <p className="text-xs font-mono text-indigo-950 dark:text-indigo-200 mt-1 break-all">
                    {action.previousStateDesc || action.sourcePath || action.target}
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Assessment Card */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Rollback Impact Assessment
                </p>
                <p className="text-xs text-amber-800/90 dark:text-amber-400/90 mt-0.5">
                  {action.impact || '1 resource will be reverted to its previous checkpoint without data loss.'}
                </p>
              </div>
            </div>

            {/* Rollback Progress Indicator when active */}
            {isRollingBack && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    Rolling back changes...
                  </span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.1 }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Restoring file buffers & snapshot checkpoints...
                </p>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/40 dark:bg-slate-900/40">
            <button
              disabled={isRollingBack}
              onClick={() => setSelectedActionForUndo(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              disabled={isRollingBack}
              onClick={handleConfirmUndo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rolling back...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo Action</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
