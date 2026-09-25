import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../../context/AgentContext';
import { 
  FileSearch, 
  X, 
  RotateCcw, 
  Clock, 
  User, 
  Target, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Code,
  Layers,
  HelpCircle
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';

export const ActionDetailsModal: React.FC = () => {
  const { 
    selectedActionForDetails, 
    setSelectedActionForDetails, 
    setSelectedActionForUndo 
  } = useAgent();

  if (!selectedActionForDetails) return null;

  const action = selectedActionForDetails;

  const handleInitiateUndo = () => {
    const act = action;
    setSelectedActionForDetails(null);
    setSelectedActionForUndo(act);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileSearch className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  ACTION DETAILS
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {action.id}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={action.status} size="sm" />
              <button
                onClick={() => setSelectedActionForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* Grid Attributes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3" /> Agent
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {action.agentAvatar} {action.agentName}
                </p>
                <p className="text-[10px] text-slate-400">{action.agentRole}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Timestamp
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {action.timestamp} ({action.timeAgo})
                </p>
                <p className="text-[10px] text-slate-400">Duration: {action.executionDurationMs || 120}ms</p>
              </div>
            </div>

            {/* Target & Action Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Action Target
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {action.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Target Resource: {action.target}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Execution Reason
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 italic">
                  “{action.reason}”
                </p>
              </div>
            </div>

            {/* Before / After State Transition */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">
                State Transition Details
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-400 shrink-0">Previous:</span>
                  <span className="break-all">{action.previousStateDesc}</span>
                </div>
                <div className="flex items-start gap-2 text-indigo-600 dark:text-indigo-300">
                  <span className="font-semibold text-indigo-500 shrink-0">New State:</span>
                  <span className="break-all">{action.newStateDesc}</span>
                </div>
              </div>
            </div>

            {/* Safety & Reversibility Matrix */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Risk Level</span>
                <div className="mt-1 flex justify-center">
                  <RiskBadge risk={action.risk} size="sm" showTooltip={false} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Reversible</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {action.reversible ? 'YES' : 'NO'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rollback Available</span>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {action.rollbackAvailable ? 'YES' : 'NO (Undone)'}
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/40 dark:bg-slate-900/40">
            <button
              onClick={() => setSelectedActionForDetails(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            {action.status === 'completed' && action.reversible && action.rollbackAvailable && (
              <button
                onClick={handleInitiateUndo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Undo Action</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
