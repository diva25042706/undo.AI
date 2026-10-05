import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { CompensationGraph } from '../components/saga/CompensationGraph';
import { WorldStatePanel } from '../components/saga/WorldStatePanel';
import { WORKFLOW_DEFINITIONS } from '../engine/workflows';
import {
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Layers,
  Sparkles,
  Zap,
  Filter,
  History,
  Clock,
  GitBranch,
  Play,
  Flame,
  FileText,
  UserCheck,
  Mail,
  RefreshCw,
} from 'lucide-react';

export const UndoCenterView: React.FC = () => {
  const {
    sagaState,
    rollbackCurrentWorkflow,
    resumeAfterCrash,
    resetWorld,
    setActiveTab,
    runtimeMetrics,
    compensatePayment,
    retryEmailNotification,
  } = useAgent();

  const [isRecovering, setIsRecovering] = useState(false);
  const currentWorkflowDef = WORKFLOW_DEFINITIONS[sagaState.workflowType];

  const handleStartRecovery = async () => {
    setIsRecovering(true);
    await rollbackCurrentWorkflow();
    setIsRecovering(false);
  };

  const isFailed = sagaState.status === 'FAILED';
  const isCrashed = sagaState.status === 'CRASHED';
  const isCompensating = sagaState.status === 'COMPENSATING';
  const isRecovered = sagaState.status === 'RECOVERED';
  const isPartial = sagaState.status === 'PARTIALLY_RECOVERED';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-rose-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-rose-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>SAGA RECOVERY & COMPENSATION COORDINATOR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Recovery Center
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Autonomous backward compensation engine. When errors or crashes occur, reverses committed steps in exact topological reverse order with ground-truth verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              disabled={isRecovering}
              onClick={handleStartRecovery}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <GitBranch className="w-4 h-4" />
              <span>Start Recovery (Reverse DAG)</span>
            </button>

            {isCrashed && (
              <button
                onClick={resumeAfterCrash}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume From Crash</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('timeline')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>View Durable Log</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Incident</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {currentWorkflowDef.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Recovery Strategy</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              SAGA_REVERSE_COMPENSATION
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">World Status</span>
            <span className={`font-bold ${sagaState.isWorldRestored ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {sagaState.isWorldRestored ? 'WORLD RESTORED ✓' : 'MUTATED / ACTIVE'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Human Escalation</span>
            <span className={`font-bold ${sagaState.requiresHumanEscalation ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {sagaState.requiresHumanEscalation ? 'REQUIRED ⚠' : 'NOT REQUIRED'}
            </span>
          </div>
        </div>
      </div>

      {/* Human Intervention Alert Box (if compensation failed) */}
      {sagaState.requiresHumanEscalation && (
        <div className="p-6 rounded-3xl bg-rose-50/95 dark:bg-rose-950/90 border-2 border-rose-500 shadow-xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>CRITICAL COMPENSATION FAILURE • HUMAN INTERVENTION REQUIRED</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Downstream Gateway Lock Conflict Detected During Rollback
              </h3>
              <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
                {sagaState.escalationReason || 'Automatic rollback encountered a remote error. Reverting to manual ledger adjustment.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">
              Recommended Operator Action Plan:
            </h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
              <li>Contact acquiring bank or gateway support with Txn token <code className="font-mono text-indigo-600 dark:text-indigo-400">TXN-CARD-8812</code> to release hold manually.</li>
              <li>Confirm Room 101 lock release in Property Management System console.</li>
              <li>Click "Reset World Baseline" after reconciliation is confirmed.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Compensation Pipeline Flow */}
      <CompensationGraph
        steps={sagaState.instance.steps}
        currentStepIndex={sagaState.currentStepIndex}
        status={sagaState.status}
        logs={sagaState.executionLogs}
        compensationSequence={sagaState.compensationSequence}
        emailNotification={sagaState.emailNotification}
        onRetryEmail={retryEmailNotification}
        onRollback={rollbackCurrentWorkflow}
        lastError={sagaState.lastError}
        workflowType={sagaState.workflowType}
        worldState={sagaState.worldState}
      />

      {/* World State Verifier */}
      <WorldStatePanel
        currentWorld={sagaState.worldState}
        baselineWorld={sagaState.baselineWorldState}
        differences={sagaState.worldDifferences}
        isWorldRestored={sagaState.isWorldRestored}
        status={sagaState.status}
        onResetWorld={resetWorld}
        onCompensatePayment={compensatePayment}
      />

    </div>
  );
};
