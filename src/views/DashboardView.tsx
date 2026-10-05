import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { StatCard } from '../components/common/StatCard';
import { CompensationGraph } from '../components/saga/CompensationGraph';
import { WorldStatePanel } from '../components/saga/WorldStatePanel';
import { FaultInjectionPanel } from '../components/saga/FaultInjectionPanel';
import { CrashRecoveryBanner } from '../components/saga/CrashRecoveryBanner';
import { LiveRideMap } from '../components/saga/LiveRideMap';
import { LiveHotelMap } from '../components/saga/LiveHotelMap';
import { WORKFLOW_DEFINITIONS } from '../engine/workflows';
import {
  Bot,
  Activity,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Play,
  Layers,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock,
  GitBranch,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    sagaState,
    selectWorkflow,
    setFaultInjection,
    runWorkflow,
    resumeAfterCrash,
    rollbackAfterCrash,
    rollbackCurrentWorkflow,
    resetWorld,
    setIsTestMatrixOpen,
    runtimeMetrics,
    setActiveTab,
    runHackathonDemo,
    compensatePayment,
    retryEmailNotification,
    triggerVoiceCall,
  } = useAgent();

  const currentWorkflowDef = WORKFLOW_DEFINITIONS[sagaState.workflowType];
  const isRunning = sagaState.status === 'RUNNING' || sagaState.status === 'COMPENSATING';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>TRANSACTIONAL EXECUTION LAYER • BUILDATHON AG02</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              AI That Acts.{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                You Stay In Control.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Every side-effecting action has a machine-readable compensation contract. When agents fail halfway, UNDO.AI orchestrates backward saga compensation and restores world state deterministically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => runWorkflow(sagaState.workflowType, 'FAIL_STEP_4')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Run AG02 Judge Demo</span>
            </button>

            <button
              onClick={() => setIsTestMatrixOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span>Test Matrix (27 Tests)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crash Banner */}
      <CrashRecoveryBanner
        isCrashed={sagaState.isSimulatedCrash}
        canResume={sagaState.canResumeAfterCrash}
        lastCompletedStep={sagaState.currentStepIndex + 1}
        duplicatePreventedCount={sagaState.duplicatePreventedCount}
        onResume={resumeAfterCrash}
        onRollback={rollbackAfterCrash}
      />

      {/* Real Runtime Calculated Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Active Workflows"
          value={runtimeMetrics.totalWorkflows}
          subtext="3 Models Registered"
          color="indigo"
          icon={Layers}
        />
        <StatCard
          label="Completed Steps"
          value={runtimeMetrics.completedSteps}
          subtext="Durable Log Verified"
          color="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Injected Failures"
          value={runtimeMetrics.failedSteps}
          subtext="Fault Engine Active"
          color="rose"
          icon={AlertTriangle}
        />
        <StatCard
          label="Compensated Steps"
          value={runtimeMetrics.compensatedSteps}
          subtext="Reverse Saga Order"
          color="purple"
          icon={RotateCcw}
        />
        <StatCard
          label="Recovery Rate"
          value={`${runtimeMetrics.recoverySuccessRate}%`}
          subtext="Mathematical Invariant"
          color="emerald"
          icon={ShieldCheck}
        />
        <StatCard
          label="Idempotency Guards"
          value={runtimeMetrics.idempotencyHits}
          subtext="0 Duplicate Charges"
          color="blue"
          icon={Zap}
        />
      </div>

      {/* Interactive Fault Injection & Workflow Trigger */}
      <FaultInjectionPanel
        sagaState={sagaState}
        onSelectWorkflow={selectWorkflow}
        onSelectFault={setFaultInjection}
        onRunWorkflow={(customParams, customCustomer) => runWorkflow(sagaState.workflowType, sagaState.faultInjection, customParams, customCustomer)}
        onResetWorld={resetWorld}
        onOpenTestMatrix={() => setIsTestMatrixOpen(true)}
        isRunning={isRunning}
      />

      {/* Live Chennai Route & Fleet Map (When Cab Workflow Active) */}
      {sagaState.workflowType === 'cab_booking' && (
        <LiveRideMap sagaState={sagaState} />
      )}

      {/* Live Chennai Hotel Inventory Map (When Hotel Workflow Active) */}
      {sagaState.workflowType === 'hotel_booking' && (
        <LiveHotelMap sagaState={sagaState} />
      )}

      {/* Saga Execution Pipeline Graph */}
      <CompensationGraph
        steps={sagaState.instance.steps}
        currentStepIndex={sagaState.currentStepIndex}
        status={sagaState.status}
        logs={sagaState.executionLogs}
        compensationSequence={sagaState.compensationSequence}
        emailNotification={sagaState.emailNotification}
        voiceCallNotification={sagaState.voiceCallNotification}
        onRetryEmail={retryEmailNotification}
        onTriggerVoiceCall={triggerVoiceCall}
        onRollback={rollbackCurrentWorkflow}
        lastError={sagaState.lastError}
        workflowType={sagaState.workflowType}
        workflowId={sagaState.workflowId}
        worldState={sagaState.worldState}
        isWorldRestored={sagaState.isWorldRestored}
      />

      {/* Deterministic Mock World Inspector */}
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
