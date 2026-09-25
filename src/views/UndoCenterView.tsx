import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Layers,
  Sparkles,
  Zap,
  Filter,
  History,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const UndoCenterView: React.FC = () => {
  const {
    actions,
    stats,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
    undoLastAction,
  } = useAgent();

  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'undone'>('safe');

  const safeActions = actions.filter(
    (a) => a.status === 'completed' && a.reversible && a.rollbackAvailable
  );
  const undoneActions = actions.filter((a) => a.status === 'undone');

  const displayedActions =
    activeFilter === 'safe'
      ? safeActions
      : activeFilter === 'undone'
      ? undoneActions
      : actions;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-rose-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-rose-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>The Main Reversibility Core</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Undo Center
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Reverse agent actions without losing control. Inspect individual file shifts, verify state diffs, or roll back in 1-click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              disabled={safeActions.length === 0}
              onClick={undoLastAction}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo Latest Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Prominent Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Safe to Undo */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              SAFE TO UNDO
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.safeToUndoCount} actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified rollback buffers ready
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Recently Undone */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              RECENTLY UNDONE
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.undoneActions} actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Restored cleanly to origin
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Failed Rollbacks */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              FAILED ROLLBACKS
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.failedRollbacks}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              100% Rollback Integrity
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('safe')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'safe'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Safe to Undo ({safeActions.length})
          </button>
          <button
            onClick={() => setActiveFilter('undone')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'undone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Recently Undone ({undoneActions.length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Action History ({actions.length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Avg Rollback: 1.2s
        </span>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedActions.map((action) => (
          <motion.div
            key={action.id}
            whileHover={{ y: -3 }}
            className={`glass-panel p-6 rounded-3xl shadow-xs border transition-all flex flex-col justify-between ${
              action.status === 'undone'
                ? 'border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            {/* Top info */}
            <div className="space-y-3">
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {action.id} • {action.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {action.title}
                  </h3>
                </div>
                <RiskBadge risk={action.risk} size="sm" />
              </div>

              {/* Agent & Executed time */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Agent: <strong className="text-slate-700 dark:text-slate-200">{action.agentAvatar} {action.agentName}</strong></span>
                <span>Executed: <strong className="text-slate-700 dark:text-slate-200">{action.timeAgo}</strong></span>
              </div>

              {/* State Transformation Box (From / To) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1.5">
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-400 shrink-0">From:</span>
                  <span className="break-all text-slate-700 dark:text-slate-300">{action.sourcePath || action.previousStateDesc}</span>
                </div>
                <div className="flex items-start gap-2 text-indigo-600 dark:text-indigo-400">
                  <span className="font-bold shrink-0">To:</span>
                  <span className="break-all font-semibold">{action.destPath || action.newStateDesc}</span>
                </div>
              </div>

              {/* Reversibility pill */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Reversible:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    YES
                  </span>
                </div>

                <StatusBadge status={action.status} size="sm" />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedActionForDetails(action)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                View Change
              </button>

              {action.status === 'completed' && action.reversible && action.rollbackAvailable && (
                <button
                  onClick={() => setSelectedActionForUndo(action)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/25 transition-all hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>UNDO</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
