import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldAlert,
  Zap,
  Play,
  Layers,
  Sparkles,
  ChevronRight,
  FileText,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Check,
  XCircle,
  TrendingUp,
  AlertOctagon,
  Target,
  Database,
  Lock,
  GitBranch,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    stats,
    liveAgent,
    actions,
    expectedState,
    verificationResult,
    recoveryStatus,
    recoveryPlan,
    confidenceMetrics,
    systemMetrics,
    activeIncident,
    setIsRecoveryPreviewOpen,
    executeIncidentRecovery,
    resetActiveIncident,
    setActiveTab,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
    runHackathonDemo,
    runIndependentVerification,
    executeIntelligentRecovery,
    undoLastAction,
    addToast,
  } = useAgent();

  const currentAction = actions.find((a) => a.id === liveAgent.currentActionId) || actions[0];
  const recentCompleted = actions.filter((a) => a.status === 'completed' || a.status === 'undone').slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Hero / Agent Control Center */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AGENT CONTROL CENTER • AG02 RECOVERY LAYER</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              AI That Acts.{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                You Stay In Control.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Predicts expected state, quantifies risk, captures real checkpoints, independently verifies outcomes, and provides intelligent 1-click recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('payment')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Open Payment Guardian</span>
            </button>

            <button
              onClick={runHackathonDemo}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-500" />
              <span>Workspace Demo</span>
            </button>

            <button
              disabled={stats.safeToUndoCount === 0}
              onClick={undoLastAction}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo Last Action</span>
            </button>
          </div>
        </div>

        {/* Live Recovery Status Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Agent Status</span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              ONLINE (Active)
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Agent</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Payment Guardian Agent
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Batch</span>
            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              BATCH-000001
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Checkpoint</span>
            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {activeIncident?.checkpoint_id || liveAgent.checkpointId || 'CP-PAY-004821'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Independent Verifier</span>
            <p className={`font-semibold mt-0.5 flex items-center gap-1 ${
              activeIncident && !activeIncident.is_resolved
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {activeIncident && !activeIncident.is_resolved ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>MISMATCH CAUGHT</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>VERIFIED SAFE</span>
                </>
              )}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Recovery Status</span>
            <div className="mt-0.5">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeIncident && !activeIncident.is_resolved
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {activeIncident && !activeIncident.is_resolved ? '[INCIDENT ACTIVE]' : '[SYSTEM SAFE]'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC SYSTEM METRICS (Calculated from Master 10k Benchmark) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {systemMetrics.totalTransactions.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Database className="w-3 h-3 text-indigo-500" /> Universal Dataset
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified States</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {systemMetrics.verifiedTransactions.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 99.7% Invariants Intact
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Anomalies Detected</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {systemMetrics.anomaliesDetected}
          </p>
          <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Independently Caught
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auto Recovered</span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {systemMetrics.autoRecovered}
          </p>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Selective Recovery
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Human Review</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {systemMetrics.humanReviewCount}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> High-Risk Escalated
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO INCIDENT PANEL — Visual Centerpiece of the Dashboard                */}
      {/* ========================================================================= */}
      {activeIncident && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-lg border-2 border-rose-500/30 dark:border-rose-500/30 bg-linear-to-b from-rose-50/20 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                activeIncident.is_resolved
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
              }`}>
                {activeIncident.is_resolved ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertOctagon className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    activeIncident.is_resolved
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {activeIncident.is_resolved ? '✓ INCIDENT RESOLVED & SAFE' : '⚠ TRANSACTION STATE MISMATCH'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    ID: {activeIncident.transaction_id}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeIncident.is_resolved
                    ? 'Transaction Safely Cancelled & Checkpoint Restored'
                    : 'Autonomous Payment Diverted to Mismatched Recipient'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRecoveryPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Recovery Preview</span>
              </button>

              {!activeIncident.is_resolved ? (
                <button
                  onClick={executeIncidentRecovery}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cancel & Recover</span>
                </button>
              ) : (
                <button
                  onClick={resetActiveIncident}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Incident</span>
                </button>
              )}
            </div>
          </div>

          {/* Expected vs Actual Side-by-Side Diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Expected State */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  EXPECTED INTENT CONTRACT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  Target
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Intended Recipient</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeIncident.expected_recipient}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Intended Amount</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    ₹{activeIncident.expected_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Account</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeIncident.expected_account}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target State</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeIncident.expected_status}
                  </p>
                </div>
              </div>
            </div>

            {/* Actual Observed State */}
            <div className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              activeIncident.is_resolved
                ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  activeIncident.is_resolved ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                }`}>
                  {activeIncident.is_resolved ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  ACTUAL OBSERVED STATE
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  activeIncident.is_resolved
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                }`}>
                  {activeIncident.is_resolved ? 'CANCELLED / SAFE' : activeIncident.actual_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Observed Recipient</span>
                  <p className={`text-sm font-bold mt-0.5 ${
                    activeIncident.is_resolved ? 'text-slate-900 dark:text-white line-through opacity-70' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {activeIncident.actual_recipient}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Executed Amount</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    ₹{activeIncident.actual_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Destination Account</span>
                  <p className={`text-xs font-mono font-semibold mt-0.5 ${
                    activeIncident.is_resolved ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {activeIncident.actual_account}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Verification Evaluation</span>
                  <p className={`text-xs font-bold mt-0.5 ${
                    activeIncident.is_resolved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {activeIncident.is_resolved ? 'PASSED (Restored)' : 'MISMATCH DETECTED'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk, Blast Radius & Recovery Confidence Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            
            {/* Risk Score */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Assessment</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {activeIncident.risk_score} / 100 — {activeIncident.risk_level}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Financial Impact</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">95%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-1.5 rounded-full w-[95%]" />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Irreversibility Threat</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">90%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full w-[90%]" />
                </div>
              </div>
            </div>

            {/* Blast Radius */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blast Radius</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeIncident.blast_radius_label}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                  {activeIncident.blast_radius_fraction}
                </p>
                <p className="text-slate-500 leading-tight">
                  Selective Recovery: Only this transaction requires intervention. All other verified transactions remain untouched.
                </p>
              </div>
            </div>

            {/* System Recovery Confidence */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Confidence</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {activeIncident.recovery_confidence}% CERTAINTY
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>State Certainty: 95%</span>
                  <span>Checkpoint: 100%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full w-[98%]" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Derived from atomic pre-execution snapshot {activeIncident.checkpoint_id}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORE DIFFERENTIATOR BANNER */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              CORE INNOVATION
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              “Don’t undo everything. Undo what went wrong.”
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Most automation asks: <em>Did the task finish?</em> UNDO.AI independently asks: <em>Did the system reach the exact state we intended?</em>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-center">
              <p className="text-xs font-bold text-indigo-200">Independent Verifier</p>
              <p className="text-sm font-extrabold text-white">Zero Trust in LLMs</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-center">
              <p className="text-xs font-bold text-indigo-200">Selective Rollback</p>
              <p className="text-sm font-extrabold text-white">0.01% Blast Radius</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Agent Activity & Workspace Links */}
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
                    ONLINE
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role: {liveAgent.role}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Policy Tier</span>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {liveAgent.policyTier}
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

        {/* Confidence Breakdown Card (1 col) */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Confidence Engine
              </h3>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                Model Certainty
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Intent Confidence:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(confidenceMetrics.intentConfidence * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Plan Confidence:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(confidenceMetrics.planConfidence * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Verification Certainty:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(confidenceMetrics.verificationConfidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('timeline')}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 transition-colors flex items-center justify-center gap-1"
          >
            <span>View Full Action Journal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Completed Actions Table */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Action Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every operation is snapshotted, risk-scored, and reversible without collateral file damage.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('timeline')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View All ({actions.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {recentCompleted.map((action) => (
            <div key={action.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl text-xs font-bold font-mono ${
                  action.status === 'undone' ? 'bg-slate-100 text-slate-500 line-through' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                }`}>
                  {action.id}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{action.title || action.actionSummary}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm">{action.target}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge risk={action.risk} />
                <StatusBadge status={action.status} />
                <span className="text-[11px] text-slate-400">{action.timeAgo}</span>

                <button
                  onClick={() => setSelectedActionForDetails(action)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
