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
  GitBranch,
  Timer,
  Check,
} from 'lucide-react';

export const UndoCenterView: React.FC = () => {
  const {
    actions,
    stats,
    recoveryPlan,
    recoveryStatus,
    executeIntelligentRecovery,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
    undoLastAction,
  } = useAgent();

  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'undone'>('safe');
  const [isRecovering, setIsRecovering] = useState(false);

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

  const handleRollbackTask = async () => {
    setIsRecovering(true);
    await executeIntelligentRecovery();
    setIsRecovering(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-rose-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-rose-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>INTELLIGENT RECOVERY & TIME TRAVEL CORE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Recovery Center
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Dependency-aware state reversal for autonomous agents. Reverses actions in topological order with ground-truth verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              disabled={isRecovering}
              onClick={handleRollbackTask}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <GitBranch className="w-4 h-4" />
              <span>Rollback Task (Dependency DAG)</span>
            </button>

            <button
              disabled={safeActions.length === 0 || isRecovering}
              onClick={undoLastAction}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo Last Action</span>
            </button>
          </div>
        </div>

        {/* Active Strategy Details Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Latest Checkpoint</span>
            <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {recoveryPlan.targetCheckpointId || 'CP-001'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Recovery Strategy</span>
            <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {recoveryPlan.recoveryStrategy} (Dependency-Aware)
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Latency</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              {recoveryPlan.estimatedRecoveryTimeSec}s
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Recovery Confidence</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {Math.round(recoveryPlan.recoveryConfidence * 100)}% Verified
            </p>
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
              Verified rollback buffers armed
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
              RESTORED TO SAFE STATE
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.undoneActions} actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reverted cleanly to origin
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Rollback Integrity */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              RECOVERY INTEGRITY
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              100%
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Zero corrupted states
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
            Restored Actions ({undoneActions.length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Journaled ({actions.length})
          </button>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedActions.map((action) => (
          <div
            key={action.id}
            className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="text-xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {action.agentAvatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {action.id} • {action.timestamp}
                    </p>
                  </div>
                </div>

                <StatusBadge status={action.status} size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{action.target}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Checkpoint:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{action.checkpointId || 'CP-001'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{action.riskScore || 20}/100</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedActionForDetails(action)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Inspect
              </button>

              {action.reversible && action.status === 'completed' && (
                <button
                  onClick={() => setSelectedActionForUndo(action)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm shadow-rose-600/20"
                >
                  Roll Back Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
