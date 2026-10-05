import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { CompensationContractCard } from '../components/saga/CompensationContractCard';
import { CompensationGraph } from '../components/saga/CompensationGraph';
import { WorldStatePanel } from '../components/saga/WorldStatePanel';
import { FaultInjectionPanel } from '../components/saga/FaultInjectionPanel';
import { CrashRecoveryBanner } from '../components/saga/CrashRecoveryBanner';
import { AIPlannerPanel } from '../components/saga/AIPlannerPanel';
import { LiveRideMap } from '../components/saga/LiveRideMap';
import { LiveHotelMap } from '../components/saga/LiveHotelMap';
import { WORKFLOW_DEFINITIONS } from '../engine/workflows';
import {
  Bot,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Code2,
  Bug,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Lock,
  Zap,
} from 'lucide-react';

export const AgentWorkspaceView: React.FC = () => {
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
    compensatePayment,
    retryEmailNotification,
    triggerVoiceCall,
  } = useAgent();

  const [activeTab, setActiveSubTab] = useState<'planner' | 'pipeline' | 'contracts' | 'world' | 'logs'>('pipeline');
  const currentWorkflowDef = WORKFLOW_DEFINITIONS[sagaState.workflowType];
  const isRunning = sagaState.status === 'RUNNING' || sagaState.status === 'COMPENSATING';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Workspace Agent Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/30 shrink-0">
              {currentWorkflowDef.avatar}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  {currentWorkflowDef.category}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ID: {sagaState.workflowId}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {currentWorkflowDef.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                {currentWorkflowDef.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveSubTab('planner')}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>GLM AI Planner</span>
            </button>

            <button
              disabled={isRunning}
              onClick={() => runWorkflow()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Execute Workflow</span>
            </button>

            <button
              disabled={isRunning}
              onClick={rollbackCurrentWorkflow}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Compensate / Rollback</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 text-xs font-bold overflow-x-auto">
          {[
            { id: 'planner', label: '🤖 0. GLM AI Planner', icon: Sparkles },
            { id: 'pipeline', label: '1. Execution & Recovery Pipeline', icon: Layers },
            { id: 'contracts', label: '2. Compensation Contracts', icon: ShieldCheck },
            { id: 'world', label: '3. Mock World State & Invariants', icon: Code2 },
            { id: 'logs', label: '4. Durable Action Log', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Crash Recovery Banner */}
      <CrashRecoveryBanner
        isCrashed={sagaState.isSimulatedCrash}
        canResume={sagaState.canResumeAfterCrash}
        lastCompletedStep={sagaState.currentStepIndex + 1}
        duplicatePreventedCount={sagaState.duplicatePreventedCount}
        onResume={resumeAfterCrash}
        onRollback={rollbackAfterCrash}
      />

      {/* Fault Injection Panel */}
      <FaultInjectionPanel
        sagaState={sagaState}
        onSelectWorkflow={selectWorkflow}
        onSelectFault={setFaultInjection}
        onRunWorkflow={(customParams, customCustomer) => runWorkflow(sagaState.workflowType, sagaState.faultInjection, customParams, customCustomer)}
        onResetWorld={resetWorld}
        onOpenTestMatrix={() => setIsTestMatrixOpen(true)}
        isRunning={isRunning}
      />

      {/* Dynamic Tab Content */}
      {activeTab === 'planner' && (
        <AIPlannerPanel
          onLoadPlan={(inst, type) => {
            selectWorkflow(type, inst.parameters, inst.customer);
            setActiveSubTab('pipeline');
          }}
          activeWorkflowType={sagaState.workflowType}
        />
      )}

      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {sagaState.workflowType === 'cab_booking' && (
            <LiveRideMap sagaState={sagaState} />
          )}

          {sagaState.workflowType === 'hotel_booking' && (
            <LiveHotelMap sagaState={sagaState} />
          )}

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
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Machine-Readable Compensation Contracts ({sagaState.instance.steps.length} Steps)
            </h3>
            <span className="text-xs text-slate-500">
              Contract guarantees: Reversibility • Idempotency • Rollback Strategy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sagaState.instance.steps.map((step) => (
              <CompensationContractCard
                key={step.stepId}
                contract={step.contract}
                stepNumber={step.stepNumber}
                isCurrent={sagaState.activeStep?.stepId === step.stepId}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'world' && (
        <WorldStatePanel
          currentWorld={sagaState.worldState}
          baselineWorld={sagaState.baselineWorldState}
          differences={sagaState.worldDifferences}
          isWorldRestored={sagaState.isWorldRestored}
          status={sagaState.status}
          onResetWorld={resetWorld}
          onCompensatePayment={compensatePayment}
        />
      )}

      {activeTab === 'logs' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Durable Execution Log Journal (Workflow ID: {sagaState.workflowId})</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {sagaState.executionLogs.length} Entries Recorded
            </span>
          </div>

          {sagaState.executionLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No entries logged for this workflow yet. Click "Execute Workflow" to begin.
            </div>
          ) : (
            <div className="space-y-2">
              {sagaState.executionLogs.map((log) => (
                <div
                  key={log.logId}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {log.timestamp}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.title}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.status === 'COMPENSATED'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : log.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    {log.sideEffectDesc || log.action}
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                    <span>idempotency_key: {log.idempotencyKey}</span>
                    {log.compensationAction && (
                      <span>compensation: {log.compensationAction}()</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
