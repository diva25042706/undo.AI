import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Bot,
  Activity,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  ShieldCheck,
  Zap,
  Play,
  Layers,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    stats,
    liveAgent,
    actions,
    setActiveTab,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
    runHackathonDemo,
  } = useAgent();

  const currentAction = actions.find((a) => a.id === liveAgent.currentActionId) || actions[0];
  const recentCompleted = actions.filter((a) => a.status === 'completed').slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Hero Section */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Real-Time Autonomous Agent Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Your AI is working.{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                You remain in control.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Monitor every action, review decisions, and undo changes instantly with granular checkpoint rollbacks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('workspace')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>View Action History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Agents"
          value={stats.activeAgents}
          subtext="Workspace & Cleanup"
          icon={Bot}
          color="indigo"
          trend="+1 ready"
          trendPositive={true}
          onClick={() => setActiveTab('workspace')}
        />
        <StatCard
          label="Actions Today"
          value={stats.actionsToday}
          subtext="Executed tasks"
          icon={Activity}
          color="blue"
          trend="+12 this hr"
          trendPositive={true}
          onClick={() => setActiveTab('timeline')}
        />
        <StatCard
          label="Reversible Actions"
          value={stats.reversibleActions}
          subtext={`${stats.safeToUndoCount} available now`}
          icon={RotateCcw}
          color="emerald"
          trend="89.3% safe"
          trendPositive={true}
          onClick={() => setActiveTab('undocenter')}
        />
        <StatCard
          label="Undo Success Rate"
          value={`${stats.undoSuccessRate}%`}
          subtext="Zero rollback fails"
          icon={CheckCircle2}
          color="purple"
          trend="100% stable"
          trendPositive={true}
        />
        <StatCard
          label="Rollback Time"
          value={stats.avgRollbackTime}
          subtext="Sub-second latency"
          icon={Clock}
          color="amber"
          trend="Instant"
          trendPositive={true}
        />
      </div>

      {/* Live Agent Activity & Reversibility Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Agent Activity Section (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/50">
                {liveAgent.avatar}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {liveAgent.name}
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role: {liveAgent.role}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {liveAgent.status}
              </p>
            </div>
          </div>

          {/* Current Task Details */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Current Task
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                “{liveAgent.currentTask}”
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">Execution Progress</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {liveAgent.progress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-linear-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${liveAgent.progress}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Current Action with Quick Buttons */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Action</span>
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {liveAgent.currentAction}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedActionForDetails(currentAction)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preview Change</span>
                </button>

                <button
                  onClick={() => setSelectedActionForUndo(currentAction)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Safety Summary Card (1 col) */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Undo Safety Engine
              </h3>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Safe Checkpoint Stack:</span>
                <span className="font-bold text-slate-900 dark:text-white">4 Snapshots</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Policy Strictness:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Approval Required</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Irreversible Actions:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">Locked / Gated</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('undocenter')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Undo Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Recent Action Timeline Strip */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Agent Actions
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('timeline')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({actions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentCompleted.map((action) => (
            <div
              key={action.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-lg p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  {action.agentAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {action.timestamp}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {action.title}
                    </h4>
                    <RiskBadge risk={action.risk} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Target: <span className="font-mono text-slate-700 dark:text-slate-300">{action.target}</span> • {action.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <StatusBadge status={action.status} size="sm" />

                <button
                  onClick={() => setSelectedActionForDetails(action)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Details
                </button>

                {action.reversible && action.status === 'completed' && (
                  <button
                    onClick={() => setSelectedActionForUndo(action)}
                    className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/60"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
