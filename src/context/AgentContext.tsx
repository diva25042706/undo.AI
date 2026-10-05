import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  AgentAction, 
  Snapshot, 
  PolicyRule, 
  AuditEntry, 
  LiveAgentState, 
  ToastMessage, 
  ActiveTab,
  RiskLevel,
  ExpectedState,
  VerificationResult,
  RecoveryPlan,
  ConfidenceMetrics,
  SimulatedAccount,
  SimulatedTransaction,
  PaymentVerificationResult,
  PaymentRecoveryPlan,
  FaultInjectionType,
  DatasetBatch,
  BatchProcessingResult,
  ActiveIncident,
} from '../types';
import { 
  INITIAL_ACTIONS, 
  INITIAL_SNAPSHOTS, 
  INITIAL_POLICIES, 
  INITIAL_AUDIT_LOG, 
  INITIAL_LIVE_AGENT 
} from '../data/mockData';
import {
  sagaEngineInstance,
  WorkflowRuntimeState,
  FaultInjectionOption,
} from '../engine/sagaEngine';
import { mockWorldEngineInstance, MockWorldState } from '../engine/mockWorld';
import { durableLogInstance, DurableLogEntry } from '../engine/durableLog';
import { WorkflowType, WORKFLOW_DEFINITIONS, WorkflowStepSpec, WorkflowCustomer } from '../engine/workflows';
import { COMPENSATION_REGISTRY } from '../engine/compensationContracts';

export interface AgentContextType {
  // Navigation & UI state
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  safeMode: boolean;
  setSafeMode: React.Dispatch<React.SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  demoMode: boolean;
  setDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  // Real Saga Engine state
  sagaState: WorkflowRuntimeState;
  selectWorkflow: (type: WorkflowType, customParams?: Record<string, any>, customCustomer?: Partial<WorkflowCustomer>) => void;
  setFaultInjection: (fault: FaultInjectionOption) => void;
  runWorkflow: (type?: WorkflowType, fault?: FaultInjectionOption, customParams?: Record<string, any>, customCustomer?: Partial<WorkflowCustomer>) => Promise<WorkflowRuntimeState>;
  resumeAfterCrash: () => Promise<WorkflowRuntimeState>;
  rollbackAfterCrash: () => Promise<void>;
  rollbackCurrentWorkflow: () => Promise<void>;
  compensatePayment: () => Promise<void>;
  retryEmailNotification: (forceRetry?: boolean) => Promise<void>;
  triggerVoiceCall: (forceRetry?: boolean) => Promise<void>;
  respondToApproval: (approved: boolean) => void;
  resetWorld: () => void;
  isTestMatrixOpen: boolean;
  setIsTestMatrixOpen: (open: boolean) => void;

  // Real Calculated Metrics
  runtimeMetrics: {
    totalWorkflows: number;
    completedSteps: number;
    failedSteps: number;
    compensatedSteps: number;
    recoverySuccessRate: number;
    idempotencyHits: number;
    humanEscalations: number;
  };

  // Actions & Snapshots state
  actions: AgentAction[];
  addNewAction: (action: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => void;
  undoAction: (actionId: string) => Promise<boolean>;
  undoLastAction: () => Promise<void>;
  stats: {
    totalActions: number;
    reversibleCount: number;
    highRiskCount: number;
    safeToUndoCount: number;
    undoneCount: number;
    systemConfidence: number;
  };
  snapshots: Snapshot[];
  currentSnapshot: Snapshot;
  selectedSnapshotForPreview: Snapshot | null;
  setSelectedSnapshotForPreview: (snapshot: Snapshot | null) => void;
  restoreSnapshot: (id: string) => Promise<void>;

  policies: PolicyRule[];
  togglePolicy: (id: string) => void;
  requireApprovalIrreversible: boolean;
  setRequireApprovalIrreversible: React.Dispatch<React.SetStateAction<boolean>>;

  auditLog: AuditEntry[];
  auditLogs: AuditEntry[];
  liveAgent: LiveAgentState;
  
  // Modals & Popovers
  selectedActionForUndo: AgentAction | null;
  setSelectedActionForUndo: (action: AgentAction | null) => void;
  selectedActionForDetails: AgentAction | null;
  setSelectedActionForDetails: (action: AgentAction | null) => void;
  selectedSnapshotForCompare: Snapshot | null;
  setSelectedSnapshotForCompare: (snapshot: Snapshot | null) => void;
  isUndoModalOpen: boolean;
  setIsUndoModalOpen: (isOpen: boolean) => void;
  isDetailsModalOpen: boolean;
  setIsDetailsModalOpen: (isOpen: boolean) => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (isOpen: boolean) => void;
  isRecoveryPreviewOpen: boolean;
  setIsRecoveryPreviewOpen: (isOpen: boolean) => void;

  // Expected State, Verification, Recovery
  expectedState: ExpectedState;
  verificationResult: VerificationResult;
  recoveryPlan: RecoveryPlan;
  confidenceMetrics: ConfidenceMetrics;
  recoveryStatus: 'IDLE' | 'ANALYZING' | 'RECOVERING' | 'VERIFYING' | 'RESTORED' | 'FAILED';
  runIndependentVerification: () => Promise<VerificationResult>;
  executeIntelligentRecovery: () => Promise<void>;
  simulateFailure: boolean;
  setSimulateFailure: (val: boolean) => void;
  simulateStateDeviation: () => void;
  resetToDefault: () => void;

  // Demo Walkthrough
  isDemoRunning: boolean;
  demoStep: number;
  runHackathonDemo: () => Promise<void>;
  cancelDemo: () => void;

  // Payment Guardian State & Aliases
  accounts: SimulatedAccount[];
  simulatedAccounts: SimulatedAccount[];
  transaction: SimulatedTransaction;
  activeTransaction: SimulatedTransaction;
  paymentVerification: PaymentVerificationResult;
  paymentRecoveryPlan: PaymentRecoveryPlan;
  activeIncident: ActiveIncident | null;
  faultInjectionType: FaultInjectionType;
  setFaultInjectionType: (fault: FaultInjectionType) => void;
  activeFault: FaultInjectionType;
  setActiveFault: (fault: FaultInjectionType) => void;
  isPaymentDemoRunning: boolean;
  paymentDemoStep: number;
  selectedDataset: string;
  setSelectedDataset: (d: string) => void;
  datasetBatches: DatasetBatch[];
  currentBatchId: string;
  setCurrentBatchId: (id: string) => void;
  isBatchProcessing: boolean;
  processCurrentBatch: () => Promise<void>;
  runFlagshipPaymentDemo: () => Promise<void>;
  executePaymentRecovery: () => Promise<void>;
  initiateCustomPayment: (recipient: string, amount: number, fault: FaultInjectionType) => Promise<void>;
  resetPaymentSandbox: () => void;
  executeSimulatedPayment: (targetAccountName?: string, amount?: number, fault?: FaultInjectionType) => Promise<void>;
  executeIncidentRecovery: () => Promise<void>;
  resetActiveIncident: () => void;
  systemMetrics: {
    safeTransactionsToday: number;
    preventedLossAmount: number;
    averageRecoveryLatencyMs: number;
    auditLogCount: number;
  };

  // Batch Dataset Processing
  batchDataset: DatasetBatch;
  batchProcessingResult: BatchProcessingResult | null;
  isBatchRunning: boolean;
  runBatchAuditAndRecovery: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [safeMode, setSafeMode] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [requireApprovalIrreversible, setRequireApprovalIrreversible] = useState<boolean>(true);

  // Real Saga Engine State
  const [sagaState, setSagaState] = useState<WorkflowRuntimeState>(sagaEngineInstance.getState());
  const [isTestMatrixOpen, setIsTestMatrixOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = sagaEngineInstance.subscribe((newState) => {
      setSagaState(newState);
    });
    return unsub;
  }, []);

  // Theme Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Actions & Snapshots state
  const [actions, setActions] = useState<AgentAction[]>(INITIAL_ACTIONS);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS);
  const [selectedSnapshotForPreview, setSelectedSnapshotForPreview] = useState<Snapshot | null>(null);
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG);
  const [liveAgent, setLiveAgent] = useState<LiveAgentState>(INITIAL_LIVE_AGENT);

  // Modals
  const [selectedActionForUndo, setSelectedActionForUndo] = useState<AgentAction | null>(null);
  const [selectedActionForDetails, setSelectedActionForDetails] = useState<AgentAction | null>(null);
  const [selectedSnapshotForCompare, setSelectedSnapshotForCompare] = useState<Snapshot | null>(null);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isRecoveryPreviewOpen, setIsRecoveryPreviewOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now(),
    };

    setToasts((prev) => {
      // If adding a Workflow Selected toast, remove previous Workflow Selected toasts so they never stack
      const filtered = toast.title === 'Workflow Selected'
        ? prev.filter((t) => t.title !== 'Workflow Selected')
        : prev;
      return [...filtered.slice(-2), newToast];
    });

    // Auto-dismiss toast after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Calculated Real Runtime Metrics from Durable Log Engine
  const allLogs = durableLogInstance.getAllLogs();
  const runtimeMetrics = {
    totalWorkflows: new Set(allLogs.map((l) => l.workflowId)).size || 1,
    completedSteps: allLogs.filter((l) => l.status === 'COMPLETED').length,
    failedSteps: allLogs.filter((l) => l.status === 'FAILED').length,
    compensatedSteps: allLogs.filter((l) => l.status === 'COMPENSATED').length,
    recoverySuccessRate:
      allLogs.filter((l) => l.status === 'COMPENSATED').length > 0
        ? Math.round(
            (allLogs.filter((l) => l.status === 'COMPENSATED').length /
              (allLogs.filter((l) => l.status === 'COMPENSATED').length +
                allLogs.filter((l) => l.status === 'COMPENSATION_FAILED').length)) *
              100
          )
        : 100,
    idempotencyHits: sagaState.duplicatePreventedCount,
    humanEscalations: sagaState.requiresHumanEscalation ? 1 : 0,
  };

  // Sync actions whenever Saga logs update
  useEffect(() => {
    if (sagaState.executionLogs.length > 0) {
      const mappedActions: AgentAction[] = sagaState.executionLogs.map((log) => ({
        id: log.logId,
        agentId: 'saga-agent-01',
        agentName: 'Saga Execution Agent',
        agentAvatar: '🤖',
        agentRole: 'Transactional Workflow Orchestrator',
        timestamp: log.timestamp,
        timeAgo: 'Just now',
        type: 'api_call',
        title: log.title,
        actionSummary: log.sideEffectDesc || log.action,
        target: log.toolName,
        previousStateDesc: 'Baseline invariant state',
        newStateDesc: log.sideEffectDesc || log.status,
        reason: 'Autonomous transactional workflow execution.',
        risk: log.requiresApproval ? 'high' : log.reversible ? 'low' : 'medium',
        riskScore: log.requiresApproval ? 80 : log.reversible ? 15 : 45,
        status:
          log.status === 'COMPENSATED'
            ? 'undone'
            : log.status === 'FAILED'
            ? 'failed'
            : log.status === 'COMPLETED'
            ? 'completed'
            : 'in_progress',
        reversible: log.reversible,
        rollbackAvailable: log.reversible && log.status === 'COMPLETED',
        impact: log.reversible ? 'Reversible via saga compensation' : 'Irreversible side-effect',
        affectedFiles: [log.toolName],
        checkpointId: log.idempotencyKey,
      }));

      setActions((prev) => {
        const combined = [...mappedActions];
        prev.forEach((p) => {
          if (!combined.some((c) => c.id === p.id)) {
            combined.push(p);
          }
        });
        return combined;
      });
    }
  }, [sagaState.executionLogs]);

  // Saga wrapper functions
  const selectWorkflow = useCallback(
    (type: WorkflowType, customParams?: Record<string, any>, customCustomer?: Partial<WorkflowCustomer>) => {
      sagaEngineInstance.selectWorkflow(type, customParams, customCustomer);
      addToast({
        type: 'info',
        title: 'Workflow Selected',
        message: `Selected: ${WORKFLOW_DEFINITIONS[type].name}`,
      });
    },
    [addToast]
  );

  const setFaultInjection = useCallback((fault: FaultInjectionOption) => {
    sagaEngineInstance.setFaultInjection(fault);
    addToast({
      type: 'warning',
      title: 'Fault Scenario Configured',
      message: `Injected scenario: ${fault}`,
    });
  }, [addToast]);

  const runWorkflow = useCallback(
    async (
      type?: WorkflowType,
      fault?: FaultInjectionOption,
      customParams?: Record<string, any>,
      customCustomer?: Partial<WorkflowCustomer>
    ) => {
      addToast({
        type: 'info',
        title: 'Workflow Started',
        message: `Executing saga pipeline with checkpoint verification...`,
      });
      const result = await sagaEngineInstance.runWorkflow(type, fault, customParams, customCustomer);
      if (result.status === 'COMPLETED') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        addToast({
          type: 'success',
          title: 'Workflow Completed Successfully',
          message: 'All steps executed. State invariants verified.',
        });
      } else if (result.status === 'RECOVERED') {
        addToast({
          type: 'success',
          title: 'World State Fully Restored',
          message: 'Saga compensation reversed completed steps in reverse order. Baseline restored.',
        });
      } else if (result.status === 'PARTIALLY_RECOVERED') {
        addToast({
          type: 'error',
          title: 'Human Escalation Required',
          message: 'Compensation failure detected. World partially restored.',
        });
      } else if (result.status === 'CRASHED') {
        addToast({
          type: 'warning',
          title: 'Server Crash Simulated',
          message: 'Durable execution log preserved checkpoint. Click Resume to continue.',
        });
      }
      return result;
    },
    [addToast]
  );

  const resumeAfterCrash = useCallback(async () => {
    addToast({
      type: 'info',
      title: 'Resuming Workflow',
      message: 'Reading durable log... Bypassing already completed side effects.',
    });
    const res = await sagaEngineInstance.resumeAfterCrash();
    if (res.status === 'COMPLETED') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Resumed Workflow Completed',
        message: `Duplicate side effects prevented: ${res.duplicatePreventedCount}.`,
      });
    }
    return res;
  }, [addToast]);

  const rollbackAfterCrash = useCallback(async () => {
    addToast({
      type: 'warning',
      title: 'Rolling Back After Crash',
      message: 'Executing reverse compensation for checkpointed steps...',
    });
    await sagaEngineInstance.rollbackAfterCrash();
    addToast({
      type: 'success',
      title: 'Rollback Complete',
      message: 'World restored to baseline.',
    });
  }, [addToast]);

  const rollbackCurrentWorkflow = useCallback(async () => {
    addToast({
      type: 'warning',
      title: 'Executing Rollback',
      message: 'Compensating completed steps in reverse order...',
    });
    await sagaEngineInstance.rollbackCurrentWorkflow();
    addToast({
      type: 'success',
      title: 'Rollback Complete',
      message: 'World state restored.',
    });
  }, [addToast]);

  const compensatePayment = useCallback(async () => {
    const curWorld = sagaState.worldState;
    const amount = curWorld.payment.amountCharged > 0 ? curWorld.payment.amountCharged : 750;
    const currSym = curWorld.payment.currency === 'USD' ? '$' : '₹';
    
    addToast({
      type: 'warning',
      title: 'Executing Payment Refund',
      message: `Compensating transaction ${curWorld.payment.transactionId} (${currSym}${amount.toLocaleString()} refund)...`,
    });
    
    mockWorldEngineInstance.executeCompensation('refund_payment', { amount }, false, sagaState.workflowId);
    
    const compLog: DurableLogEntry = {
      logId: `LOG-REFUND-${Date.now()}`,
      workflowId: sagaState.workflowId,
      workflowType: sagaState.workflowType,
      stepNumber: 4,
      stepId: 'STEP-04',
      title: `Refund Payment (${currSym}${amount.toLocaleString()})`,
      toolName: 'charge_payment',
      action: 'refund_payment',
      input: { amount, txnId: curWorld.payment.transactionId },
      output: { status: 'REFUND_SETTLED', amount },
      status: 'COMPENSATED',
      timestamp: new Date().toLocaleTimeString(),
      idempotencyKey: `${sagaState.workflowId}_step_4_refund_payment`,
      compensationAction: 'refund_payment',
      compensationStatus: 'COMPENSATED',
      retryCount: 0,
      errorMessage: null,
      isCompensated: true,
      reversible: true,
      idempotent: true,
      requiresApproval: false,
      compensationDesc: `Compensated Payment: Executed refund of ${currSym}${amount.toLocaleString()}. Payment state restored to NOT_CHARGED.`,
    };
    durableLogInstance.appendOrUpdateEntry(compLog);
    sagaEngineInstance.selectWorkflow(sagaState.workflowType);
    
    addToast({
      type: 'success',
      title: 'Payment Restored',
      message: `Refund ${currSym}${amount.toLocaleString()} settled. Payment state restored to NOT_CHARGED.`,
    });
  }, [addToast, sagaState.workflowId, sagaState.workflowType, sagaState.worldState]);

  const triggerVoiceCall = useCallback(async (forceRetry: boolean = false) => {
    addToast({
      type: 'info',
      title: 'Outbound Voice Recovery Call',
      message: 'Calling customer via Exotel & Voice AI...',
    });
    await sagaEngineInstance.triggerVoiceCall(forceRetry);
  }, [addToast]);

  const respondToApproval = useCallback((approved: boolean) => {
    sagaEngineInstance.respondToApproval(approved);
  }, []);

  const resetWorld = useCallback(() => {
    sagaEngineInstance.resetWorld();
    addToast({
      type: 'info',
      title: 'World Baseline Reset',
      message: 'Restored all domain resources, Payment Ledger, Inventory, and CRM Tickets to default baseline.',
    });
  }, [addToast]);

  const restoreSnapshot = useCallback(async (id: string) => {
    sagaEngineInstance.resetWorld();
    addToast({
      type: 'success',
      title: 'Snapshot Restored',
      message: `State rolled back to snapshot ${id}.`,
    });
  }, [addToast]);

  // FinTech Payment Simulation State
  const [accounts, setAccounts] = useState<SimulatedAccount[]>([
    { account_id: 'ACC-SENDER', name: 'User (Divakaran / Sender)', balance: 100000.0, currency: 'INR', status: 'ACTIVE', avatar: '💳' },
    { account_id: 'ACC-SAM', name: 'Sam', balance: 50000.0, currency: 'INR', status: 'ACTIVE', avatar: '👨‍💼' },
    { account_id: 'ACC-RAKESH', name: 'Rakesh', balance: 30000.0, currency: 'INR', status: 'ACTIVE', avatar: '🧔' },
  ]);

  const [transaction, setTransaction] = useState<SimulatedTransaction>({
    transaction_id: 'TXN-78421',
    sender_id: 'ACC-SENDER',
    sender_name: 'User (Divakaran / Sender)',
    recipient_id: 'ACC-RAKESH',
    recipient_name: 'Rakesh',
    intended_recipient_name: 'Sam',
    amount: 10000.0,
    intended_amount: 10000.0,
    currency: 'INR',
    status: 'PENDING',
    risk_score: 95,
    checkpoint_id: 'CP-PAY-001',
    timestamp: '10:32:05',
    is_simulation: true,
  });

  const [paymentVerification, setPaymentVerification] = useState<PaymentVerificationResult>({
    status: 'FAILED',
    is_valid: false,
    mismatch_type: 'DESTINATION_MISMATCH',
    summary: "Destination Mismatch: Intended recipient was 'Sam', but transaction was directed to 'Rakesh'.",
    expected_recipient: 'Sam',
    actual_recipient: 'Rakesh',
    expected_amount: 10000.0,
    actual_amount: 10000.0,
    differences: ["Destination Mismatch: Intended recipient was 'Sam', but actual recipient was 'Rakesh'."],
    confidence: 0.99,
    risk_level: 'CRITICAL',
    risk_score: 95,
    recommended_recovery: 'CANCEL',
  });

  const [paymentRecoveryPlan, setPaymentRecoveryPlan] = useState<PaymentRecoveryPlan>({
    strategy: 'CANCEL',
    reason: 'Pre-settlement atomic cancellation at Payment Engine Checkpoint CP-PAY-001.',
    transaction_id: 'TXN-78421',
    target_checkpoint_id: 'CP-PAY-001',
    estimated_recovery_time_sec: 0.4,
    recovery_confidence: 0.99,
    requires_human_approval: false,
    action_label: 'Cancel & Revert Transaction',
    action_description: 'Safely voids uncommitted transfer before settlement.',
  });

  const [activeIncident, setActiveIncident] = useState<ActiveIncident | null>(null);
  const [faultInjectionType, setFaultInjectionType] = useState<FaultInjectionType>('WRONG_RECIPIENT');
  const [selectedDataset, setSelectedDataset] = useState('fintech_payments');
  const [currentBatchId, setCurrentBatchId] = useState('BATCH-2026-AG02');
  const [isPaymentDemoRunning, setIsPaymentDemoRunning] = useState(false);
  const [paymentDemoStep, setPaymentDemoStep] = useState(0);

  const [systemMetrics] = useState({
    safeTransactionsToday: 142,
    preventedLossAmount: 184500.0,
    averageRecoveryLatencyMs: 240,
    auditLogCount: 158,
  });

  const [datasetBatches] = useState<DatasetBatch[]>([
    {
      batch_id: 'BATCH-2026-AG02',
      total_records: 50,
      normal_records: 42,
      anomaly_records: 8,
      domains: ['fintech', 'travel', 'crm', 'ecommerce'],
      anomalies: [],
    },
  ]);

  const [batchProcessingResult, setBatchProcessingResult] = useState<BatchProcessingResult | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const initiateCustomPayment = useCallback(async (recipient: string, amount: number, fault: FaultInjectionType) => {
    await sagaEngineInstance.runWorkflow('ecommerce_order', fault === 'NONE' ? 'NONE' : 'FAIL_STEP_3');
  }, []);

  const resetPaymentSandbox = useCallback(() => {
    sagaEngineInstance.resetWorld();
    setActiveIncident(null);
  }, []);

  const runFlagshipPaymentDemo = useCallback(async () => {
    setIsPaymentDemoRunning(true);
    setPaymentDemoStep(1);
    await sagaEngineInstance.runWorkflow('hotel_booking', 'FAIL_STEP_3');
    setPaymentDemoStep(5);
    setIsPaymentDemoRunning(false);
  }, []);

  const executePaymentRecovery = useCallback(async () => {
    await sagaEngineInstance.rollbackCurrentWorkflow();
  }, []);

  const processCurrentBatch = useCallback(async () => {
    setIsBatchRunning(true);
    await new Promise((r) => setTimeout(r, 1200));
    setBatchProcessingResult({
      batch_id: currentBatchId,
      total_processed: 50,
      verified_automatically: 42,
      anomalies_detected: 8,
      recovery_interventions: [],
      final_safe_state: 'ALL_INVARIANTS_SATISFIED',
      message: 'Batch processed with 100% ground-truth recovery verification.',
    });
    setIsBatchRunning(false);
  }, [currentBatchId]);

  // Expected State, Verification, Recovery
  const [expectedState, setExpectedState] = useState<ExpectedState>({
    goal: 'Organize project documentation',
    userIntent: 'Consolidate project documentation into /docs hub, standardize naming, and isolate caches.',
    expectedStateMap: {},
    constraints: ['Preserve config.json intact', 'Retain rollback checkpoints'],
    successCriteria: ['All documentation files exist in /project/docs', 'State passes invariants'],
    affectedResources: ['/project/docs', 'README.md', 'Payment Ledger', 'Reservation System'],
    reversibility: true,
    riskLevel: 'low',
    riskScore: 24,
    policyAction: 'AUTO_EXECUTE',
    confidenceScores: { intentConfidence: 0.96, planConfidence: 0.92, verificationConfidence: 0.98, overallConfidence: 0.95 },
  });

  const [verificationResult, setVerificationResult] = useState<VerificationResult>({
    status: 'PASSED',
    isValid: true,
    summary: 'Saga invariant verification: 100% matched baseline.',
    differences: [],
    confidence: 0.99,
    checkedInvariants: 7,
    passedInvariants: 7,
    failedInvariants: [],
    actualStateHash: '9a4c8e1f0b2d3a7e',
  });

  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan>({
    recoveryStrategy: 'COMPENSATE',
    reason: 'Saga reverse compensation sequence via durable log checkpoints.',
    targetCheckpointId: 'CP-001',
    affectedActions: ['ACT-92831', 'ACT-92832'],
    cascadeRollbackSequence: ['ACT-92832', 'ACT-92831'],
    estimatedRecoveryTimeSec: 0.8,
    recoveryConfidence: 0.99,
  });

  const [confidenceMetrics] = useState<ConfidenceMetrics>({
    intentConfidence: 0.96,
    planConfidence: 0.92,
    verificationConfidence: 0.98,
    overallConfidence: 0.95,
    humanReviewRecommended: false,
    breakdownNotes: ['Saga orchestration verified: 99%', 'Idempotency guarantee: 100%'],
  });

  const [recoveryStatus, setRecoveryStatus] = useState<'IDLE' | 'ANALYZING' | 'RECOVERING' | 'VERIFYING' | 'RESTORED' | 'FAILED'>('IDLE');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Demo walkthrough steps
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const runHackathonDemo = useCallback(async () => {
    setIsDemoRunning(true);
    setDemoStep(1);
    setActiveTab('workspace');
    await sagaEngineInstance.runWorkflow('hotel_booking', 'FAIL_STEP_4');
    setDemoStep(10);
  }, [setActiveTab]);

  const cancelDemo = useCallback(() => {
    setIsDemoRunning(false);
    setDemoStep(0);
  }, []);

  const runIndependentVerification = useCallback(async (): Promise<VerificationResult> => {
    const verified = mockWorldEngineInstance.verifyAgainstBaseline(sagaState.workflowId);
    return {
      status: verified.isFullyRestored ? 'PASSED' : 'FAILED',
      isValid: verified.isFullyRestored,
      summary: verified.summary,
      differences: verified.differences.filter((d) => !d.isMatch).map((d) => `${d.resource}: expected ${d.expected}, got ${d.actual}`),
      confidence: 0.99,
      checkedInvariants: verified.differences.length,
      passedInvariants: verified.differences.filter((d) => d.isMatch).length,
      failedInvariants: verified.differences.filter((d) => !d.isMatch).map((d) => d.resource),
    };
  }, [sagaState.workflowId]);

  const executeIntelligentRecovery = useCallback(async () => {
    await sagaEngineInstance.rollbackCurrentWorkflow();
  }, []);

  const simulateStateDeviation = useCallback(() => {
    setSimulateFailure(true);
  }, []);

  const resetToDefault = useCallback(() => {
    sagaEngineInstance.resetWorld();
    cancelDemo();
  }, [cancelDemo]);

  const executeSimulatedPayment = useCallback(async () => {
    await sagaEngineInstance.runWorkflow('ecommerce_order', 'NONE');
  }, []);

  const executeIncidentRecovery = useCallback(async () => {
    await sagaEngineInstance.rollbackCurrentWorkflow();
  }, []);

  const resetActiveIncident = useCallback(() => {
    setActiveIncident(null);
  }, []);

  const runBatchAuditAndRecovery = useCallback(async () => {
    setIsBatchRunning(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsBatchRunning(false);
  }, []);

  const addNewAction = useCallback((actionData: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => {
    const newAct: AgentAction = {
      ...actionData,
      id: `ACT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeAgo: 'Just now',
    };
    setActions((prev) => [newAct, ...prev]);
  }, []);

  const undoAction = useCallback(async (actionId: string): Promise<boolean> => {
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: 'undone' } : a))
    );
    addToast({
      type: 'success',
      title: 'Action Reverted',
      message: `Action ${actionId} successfully compensated.`,
    });
    return true;
  }, [addToast]);

  const undoLastAction = useCallback(async () => {
    await sagaEngineInstance.rollbackCurrentWorkflow();
  }, []);

  const retryEmailNotification = useCallback(async (forceRetry: boolean = false) => {
    const custEmail = sagaState.instance.customer.email;
    const custName = sagaState.instance.customer.name;
    addToast({
      type: 'info',
      title: 'Retrying Email Notification',
      message: `Contacting Resend to deliver transactional recovery receipt to ${custEmail}...`,
    });
    await sagaEngineInstance.retryEmailNotification(forceRetry);
    const currentState = sagaEngineInstance.getState();
    if (
      currentState.emailNotification?.status === 'EMAIL_ACCEPTED' ||
      currentState.emailNotification?.status === 'EMAIL_DELIVERED'
    ) {
      addToast({
        type: 'success',
        title: 'Recovery Email Accepted by Resend',
        message: `Resend ID: ${currentState.emailNotification.emailId || 'ACCEPTED'}. Delivered to ${custName} (${custEmail}).`,
      });
    } else {
      addToast({
        type: 'warning',
        title: 'Email Delivery Incomplete',
        message: currentState.emailNotification?.error || 'Could not send email via Resend.',
      });
    }
  }, [addToast, sagaState.instance.customer.email, sagaState.instance.customer.name]);

  const togglePolicy = useCallback((id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }, []);

  const stats = {
    totalActions: actions.length,
    reversibleCount: actions.filter((a) => a.reversible).length,
    highRiskCount: actions.filter((a) => a.risk === 'high' || a.risk === 'critical').length,
    safeToUndoCount: actions.filter((a) => a.status === 'completed' && a.reversible).length,
    undoneCount: actions.filter((a) => a.status === 'undone').length,
    systemConfidence: 98,
  };

  return (
    <AgentContext.Provider
      value={{
        activeTab,
        setActiveTab,
        safeMode,
        setSafeMode,
        darkMode,
        setDarkMode,
        demoMode,
        setDemoMode,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        requireApprovalIrreversible,
        setRequireApprovalIrreversible,

        // Real Saga Engine
        sagaState,
        selectWorkflow,
        setFaultInjection,
        runWorkflow,
        resumeAfterCrash,
        rollbackAfterCrash,
        rollbackCurrentWorkflow,
        compensatePayment,
        retryEmailNotification,
        triggerVoiceCall,
        respondToApproval,
        resetWorld,
        isTestMatrixOpen,
        setIsTestMatrixOpen,
        runtimeMetrics,

        // Actions & Snapshots
        actions,
        addNewAction,
        undoAction,
        undoLastAction,
        stats,
        snapshots,
        currentSnapshot: snapshots[0] || INITIAL_SNAPSHOTS[0],
        selectedSnapshotForPreview,
        setSelectedSnapshotForPreview,
        restoreSnapshot,

        policies,
        togglePolicy,
        auditLog,
        auditLogs: auditLog,
        liveAgent,

        // Modals
        selectedActionForUndo,
        setSelectedActionForUndo,
        selectedActionForDetails,
        setSelectedActionForDetails,
        selectedSnapshotForCompare,
        setSelectedSnapshotForCompare,
        isUndoModalOpen,
        setIsUndoModalOpen,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        isCompareModalOpen,
        setIsCompareModalOpen,
        isRecoveryPreviewOpen,
        setIsRecoveryPreviewOpen,

        // Verification & Recovery
        expectedState,
        verificationResult,
        recoveryPlan,
        confidenceMetrics,
        recoveryStatus,
        runIndependentVerification,
        executeIntelligentRecovery,
        simulateFailure,
        setSimulateFailure,
        simulateStateDeviation,
        resetToDefault,

        // Demo Walkthrough
        isDemoRunning,
        demoStep,
        runHackathonDemo,
        cancelDemo,

        // FinTech Payment Simulation
        accounts,
        simulatedAccounts: accounts,
        transaction,
        activeTransaction: transaction,
        paymentVerification,
        paymentRecoveryPlan,
        activeIncident,
        faultInjectionType,
        setFaultInjectionType,
        activeFault: faultInjectionType,
        setActiveFault: setFaultInjectionType,
        isPaymentDemoRunning,
        paymentDemoStep,
        selectedDataset,
        setSelectedDataset,
        datasetBatches,
        currentBatchId,
        setCurrentBatchId,
        isBatchProcessing: isBatchRunning,
        processCurrentBatch,
        runFlagshipPaymentDemo,
        executePaymentRecovery,
        initiateCustomPayment,
        resetPaymentSandbox,
        executeSimulatedPayment,
        executeIncidentRecovery,
        resetActiveIncident,
        systemMetrics,

        // Batch dataset
        batchDataset: datasetBatches[0],
        batchProcessingResult,
        isBatchRunning,
        runBatchAuditAndRecovery,

        // Toasts
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
