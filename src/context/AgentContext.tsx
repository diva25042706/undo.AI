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
import { ApiService } from '../services/api';

const DEFAULT_EXPECTED_STATE: ExpectedState = {
  goal: 'Organize project documentation',
  userIntent: 'Consolidate project documentation into /docs hub, standardize naming, and isolate caches.',
  expectedStateMap: {
    '/project/docs/README.md': { presence: 'EXISTS', origin: '/project/README.md' },
    '/project/docs/architecture.pdf': { presence: 'EXISTS', origin: '/project/architecture.pdf' },
    '/project/final_report_v2.pdf': { presence: 'EXISTS', origin: '/project/report.pdf' },
    '/project/app.py': { presence: 'EXISTS', unchanged: true },
    '/project/config.json': { presence: 'EXISTS', unchanged: true },
    '/project/README.md': { presence: 'ABSENT', reason: 'Moved to /docs' },
    '/project/architecture.pdf': { presence: 'ABSENT', reason: 'Moved to /docs' },
  },
  constraints: [
    'Do not delete source code files (app.py)',
    'Preserve config.json contents intact without modification',
    'Ensure all documentation files exist in /project/docs',
    'Retain rollback checkpoints for all file operations',
  ],
  successCriteria: [
    'All documentation files exist in /project/docs',
    'No documentation files remain in the root directory',
    'File contents and code functionality remain unchanged',
    'State independently passes SHA-256 hash invariant validation',
  ],
  affectedResources: [
    '/project/docs',
    '/project/README.md',
    '/project/docs/README.md',
    '/project/architecture.pdf',
    '/project/docs/architecture.pdf',
    '/project/report.pdf',
    '/project/final_report_v2.pdf',
  ],
  reversibility: true,
  riskLevel: 'low',
  riskScore: 24,
  policyAction: 'AUTO_EXECUTE',
  confidenceScores: {
    intentConfidence: 0.96,
    planConfidence: 0.92,
    verificationConfidence: 0.98,
    overallConfidence: 0.95,
  },
};

const DEFAULT_VERIFICATION: VerificationResult = {
  status: 'PASSED',
  isValid: true,
  summary: 'Independent verification PASSED (8/8 state invariants verified).',
  differences: [],
  confidence: 0.98,
  checkedInvariants: 8,
  passedInvariants: 8,
  failedInvariants: [],
  actualStateHash: '9a4c8e1f0b2d3a7e',
};

const DEFAULT_RECOVERY_PLAN: RecoveryPlan = {
  recoveryStrategy: 'ROLLBACK',
  reason: 'Dependency-aware rollback via baseline checkpoint CP-001.',
  targetCheckpointId: 'CP-001',
  affectedActions: ['ACT-92831', 'ACT-92832', 'ACT-92833'],
  cascadeRollbackSequence: ['ACT-92833', 'ACT-92832', 'ACT-92831'],
  estimatedRecoveryTimeSec: 1.2,
  recoveryConfidence: 0.98,
};

const DEFAULT_CONFIDENCE: ConfidenceMetrics = {
  intentConfidence: 0.96,
  planConfidence: 0.92,
  verificationConfidence: 0.98,
  overallConfidence: 0.95,
  humanReviewRecommended: false,
  breakdownNotes: [
    'Intent parse clarity: 96%',
    'Plan step feasibility: 92%',
    'Ground truth verification certainty: 98%',
  ],
};

const INITIAL_SIMULATED_ACCOUNTS: SimulatedAccount[] = [
  { account_id: 'ACC-SENDER', name: 'User (JD / Sender)', balance: 100000.0, currency: 'INR', status: 'ACTIVE', avatar: '💳' },
  { account_id: 'ACC-SAM', name: 'Sam', balance: 50000.0, currency: 'INR', status: 'ACTIVE', avatar: '👨‍💼' },
  { account_id: 'ACC-RAHUL', name: 'Rahul', balance: 50000.0, currency: 'INR', status: 'ACTIVE', avatar: '🧑‍💻' },
  { account_id: 'ACC-RAHUL-K', name: 'Rahul K', balance: 25000.0, currency: 'INR', status: 'ACTIVE', avatar: '👨‍🎓' },
  { account_id: 'ACC-RAKESH', name: 'Rakesh', balance: 30000.0, currency: 'INR', status: 'ACTIVE', avatar: '🧔' },
  { account_id: 'ACC-MERCHANT', name: 'Merchant A (Tech Store)', balance: 15000.0, currency: 'INR', status: 'ACTIVE', avatar: '🏪' },
  { account_id: 'ACC-INVEST', name: 'Investment Treasury Account', balance: 200000.0, currency: 'INR', status: 'ACTIVE', avatar: '📈' },
];

const INITIAL_TRANSACTION: SimulatedTransaction = {
  transaction_id: 'TXN-78421',
  sender_id: 'ACC-SENDER',
  sender_name: 'User (JD / Sender)',
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
};

const INITIAL_PAYMENT_VERIFICATION: PaymentVerificationResult = {
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
};

const INITIAL_PAYMENT_RECOVERY: PaymentRecoveryPlan = {
  strategy: 'CANCEL',
  reason: 'Payment is currently PENDING. Mismatch detected before ledger settlement. Safe cancellation armed.',
  transaction_id: 'TXN-78421',
  target_checkpoint_id: 'CP-PAY-001',
  estimated_recovery_time_sec: 0.5,
  recovery_confidence: 0.99,
  requires_human_approval: false,
  action_label: 'Cancel Payment & Restore Balance',
  action_description: 'Cancels the in-flight simulated payment and restores reserved funds from checkpoint CP-PAY-001.',
};

const INITIAL_INCIDENT: ActiveIncident = {
  transaction_id: 'TXN-004821',
  expected_recipient: 'Rahul',
  actual_recipient: 'Rakesh',
  expected_amount: 10000.0,
  actual_amount: 10000.0,
  expected_account: 'ACC1004',
  actual_account: 'ACC1099',
  expected_status: 'COMPLETED',
  actual_status: 'PENDING',
  risk_score: 96,
  risk_level: 'CRITICAL',
  blast_radius_label: 'LOW BLAST RADIUS',
  blast_radius_fraction: '1 / 10,000 transactions',
  recovery_strategy: 'CANCEL TRANSACTION',
  recovery_confidence: 98,
  checkpoint_id: 'CP-PAY-004821',
  is_resolved: false,
};

interface AgentContextType {
  // Navigation & UI state
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  safeMode: boolean;
  setSafeMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  demoMode: boolean;
  setDemoMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Domain State
  actions: AgentAction[];
  snapshots: Snapshot[];
  policies: PolicyRule[];
  auditLogs: AuditEntry[];
  liveAgent: LiveAgentState;
  requireApprovalIrreversible: boolean;
  setRequireApprovalIrreversible: (val: boolean) => void;

  // Engine States
  expectedState: ExpectedState;
  verificationResult: VerificationResult;
  recoveryPlan: RecoveryPlan;
  recoveryStatus: 'SAFE' | 'WARNING' | 'FAILED' | 'RECOVERING' | 'RECOVERED';
  confidenceMetrics: ConfidenceMetrics;
  simulateFailure: boolean;
  setSimulateFailure: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Simulated Payment Guardian State
  simulatedAccounts: SimulatedAccount[];
  activeTransaction: SimulatedTransaction | null;
  paymentVerification: PaymentVerificationResult | null;
  paymentRecoveryPlan: PaymentRecoveryPlan | null;
  activeFault: FaultInjectionType;
  setActiveFault: (val: FaultInjectionType) => void;
  isPaymentDemoRunning: boolean;
  paymentDemoStep: number;
  runFlagshipPaymentDemo: () => Promise<void>;
  executePaymentRecovery: () => Promise<boolean>;
  initiateCustomPayment: (recipient: string, amount: number, fault?: FaultInjectionType) => Promise<void>;
  resetPaymentSandbox: () => Promise<void>;

  // Master Synthetic Benchmark Datasets & Batch Processing
  selectedDataset: string;
  setSelectedDataset: (name: string) => void;
  datasetBatches: DatasetBatch[];
  currentBatchId: string;
  setCurrentBatchId: (id: string) => void;
  batchProcessingResult: BatchProcessingResult | null;
  isBatchProcessing: boolean;
  processCurrentBatch: () => Promise<void>;

  // Incident & Recovery Preview
  activeIncident: ActiveIncident | null;
  setActiveIncident: (inc: ActiveIncident | null) => void;
  isRecoveryPreviewOpen: boolean;
  setIsRecoveryPreviewOpen: (val: boolean) => void;
  executeIncidentRecovery: () => Promise<boolean>;
  resetActiveIncident: () => void;

  // Dynamic Dataset Metrics
  systemMetrics: {
    totalTransactions: number;
    verifiedTransactions: number;
    anomaliesDetected: number;
    autoRecovered: number;
    humanReviewCount: number;
  };

  // Selected Items for Modals
  selectedActionForUndo: AgentAction | null;
  setSelectedActionForUndo: (action: AgentAction | null) => void;
  selectedActionForDetails: AgentAction | null;
  setSelectedActionForDetails: (action: AgentAction | null) => void;
  selectedSnapshotForPreview: Snapshot | null;
  setSelectedSnapshotForPreview: (snapshot: Snapshot | null) => void;

  // Operations
  generateExpectedState: (goal: string) => Promise<void>;
  runIndependentVerification: (injectFailure?: boolean) => Promise<VerificationResult>;
  executeIntelligentRecovery: () => Promise<boolean>;
  undoAction: (actionId: string) => Promise<boolean>;
  undoLastAction: () => Promise<boolean>;
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
  togglePolicy: (policyId: string) => void;
  addNewAction: (newAction: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => void;
  resetToDefault: () => void;

  // Hackathon Workspace Demo Controller
  isDemoRunning: boolean;
  demoStep: number;
  runHackathonDemo: () => Promise<void>;
  cancelDemo: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Computed Stats
  stats: {
    activeAgents: number;
    actionsToday: number;
    reversibleActions: number;
    undoneActions: number;
    undoSuccessRate: number;
    avgRollbackTime: string;
    safeToUndoCount: number;
    failedRollbacks: number;
    riskScore: number;
  };
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [safeMode, setSafeMode] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [actions, setActions] = useState<AgentAction[]>(() => {
    return INITIAL_ACTIONS.map(a => ({
      ...a,
      riskScore: a.risk === 'high' ? 80 : a.risk === 'medium' ? 45 : 20,
      checkpointId: 'CP-104',
      policyAction: a.risk === 'high' ? 'REQUIRE_STRONG_VERIFICATION' : 'AUTO_EXECUTE',
    }));
  });
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS);
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG);
  const [liveAgent, setLiveAgent] = useState<LiveAgentState>({
    ...INITIAL_LIVE_AGENT,
    riskScore: 24,
    policyTier: 'AUTO_EXECUTE',
    checkpointId: 'CP-104',
  });
  const [requireApprovalIrreversible, setRequireApprovalIrreversible] = useState<boolean>(true);

  // Engine States
  const [expectedState, setExpectedState] = useState<ExpectedState>(DEFAULT_EXPECTED_STATE);
  const [verificationResult, setVerificationResult] = useState<VerificationResult>(DEFAULT_VERIFICATION);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan>(DEFAULT_RECOVERY_PLAN);
  const [recoveryStatus, setRecoveryStatus] = useState<'SAFE' | 'WARNING' | 'FAILED' | 'RECOVERING' | 'RECOVERED'>('SAFE');
  const [confidenceMetrics, setConfidenceMetrics] = useState<ConfidenceMetrics>(DEFAULT_CONFIDENCE);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // Payment Guardian State
  const [simulatedAccounts, setSimulatedAccounts] = useState<SimulatedAccount[]>(INITIAL_SIMULATED_ACCOUNTS);
  const [activeTransaction, setActiveTransaction] = useState<SimulatedTransaction | null>(INITIAL_TRANSACTION);
  const [paymentVerification, setPaymentVerification] = useState<PaymentVerificationResult | null>(INITIAL_PAYMENT_VERIFICATION);
  const [paymentRecoveryPlan, setPaymentRecoveryPlan] = useState<PaymentRecoveryPlan | null>(INITIAL_PAYMENT_RECOVERY);
  const [activeFault, setActiveFault] = useState<FaultInjectionType>('WRONG_RECIPIENT');
  const [isPaymentDemoRunning, setIsPaymentDemoRunning] = useState<boolean>(false);
  const [paymentDemoStep, setPaymentDemoStep] = useState<number>(0);

  // Master Synthetic Benchmark Datasets & Batch Processing
  const [selectedDataset, setSelectedDataset] = useState<string>('UNDO AI Universal (10,000 records)');
  const [datasetBatches, setDatasetBatches] = useState<DatasetBatch[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string>('BATCH-000001');
  const [batchProcessingResult, setBatchProcessingResult] = useState<BatchProcessingResult | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Active Incident & Recovery Preview
  const [activeIncident, setActiveIncident] = useState<ActiveIncident | null>(INITIAL_INCIDENT);
  const [isRecoveryPreviewOpen, setIsRecoveryPreviewOpen] = useState<boolean>(false);

  // Dynamic Dataset Metrics
  const [systemMetrics, setSystemMetrics] = useState({
    totalTransactions: 10000,
    verifiedTransactions: 9970,
    anomaliesDetected: 30,
    autoRecovered: 27,
    humanReviewCount: 3,
  });

  // Modals state
  const [selectedActionForUndo, setSelectedActionForUndo] = useState<AgentAction | null>(null);
  const [selectedActionForDetails, setSelectedActionForDetails] = useState<AgentAction | null>(null);
  const [selectedSnapshotForPreview, setSelectedSnapshotForPreview] = useState<Snapshot | null>(null);

  // Workspace Demo state
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  // Load dataset batches on mount
  useEffect(() => {
    async function loadBatches() {
      const data = await ApiService.getDatasetBatches(15);
      if (data && Array.isArray(data)) {
        setDatasetBatches(data);
      }
    }
    loadBatches();
  }, []);

  // Process Batch through UNDO.AI Engine
  const processCurrentBatch = useCallback(async () => {
    setIsBatchProcessing(true);
    addToast({
      type: 'info',
      title: 'Batch Processing Started',
      message: `Analyzing 100 transactions in ${currentBatchId}...`,
    });

    try {
      const result = await ApiService.processBatch(currentBatchId);
      if (result) {
        setBatchProcessingResult(result);
        
        // Update live metrics dynamically
        setSystemMetrics((prev: any) => ({
          ...prev,
          verifiedTransactions: prev.verifiedTransactions + result.verified_automatically,
          anomaliesDetected: prev.anomaliesDetected + result.anomalies_detected,
          autoRecovered: prev.autoRecovered + result.anomalies_detected,
        }));

        // Set active incident from first anomaly in batch if available
        if (result.recovery_interventions && result.recovery_interventions.length > 0) {
          const firstAnomaly = result.recovery_interventions[0];
          setActiveIncident({
            transaction_id: firstAnomaly.transaction_id,
            expected_recipient: 'Rahul',
            actual_recipient: firstAnomaly.customer_name || 'Rakesh',
            expected_amount: firstAnomaly.amount || 10000.0,
            actual_amount: firstAnomaly.amount || 10000.0,
            expected_account: 'ACC1004',
            actual_account: 'ACC1099',
            expected_status: 'COMPLETED',
            actual_status: 'PENDING',
            risk_score: 96,
            risk_level: 'CRITICAL',
            blast_radius_label: 'LOW BLAST RADIUS',
            blast_radius_fraction: `1 / ${result.total_processed} in batch`,
            recovery_strategy: firstAnomaly.recovery_action || 'CANCEL TRANSACTION',
            recovery_confidence: 98,
            checkpoint_id: firstAnomaly.checkpoint_restored || 'CP-PAY-004821',
            is_resolved: false,
          });
        }

        triggerConfetti();
        addToast({
          type: 'success',
          title: `Batch ${currentBatchId} Verified & Safe`,
          message: `${result.total_processed} processed: ${result.verified_automatically} verified, ${result.anomalies_detected} anomalies recovered. (100% SAFE)`,
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Batch Processing Error',
        message: 'Could not complete batch processing.',
      });
    } finally {
      setIsBatchProcessing(false);
    }
  }, [currentBatchId, addToast]);

  // Execute Incident Recovery
  const executeIncidentRecovery = useCallback(async (): Promise<boolean> => {
    if (!activeIncident) return false;

    setIsRecoveryPreviewOpen(false);
    addToast({
      type: 'info',
      title: 'Executing Recovery',
      message: `Applying ${activeIncident.recovery_strategy} for ${activeIncident.transaction_id}...`,
    });

    await new Promise((r) => setTimeout(r, 600));

    setActiveIncident(prev => prev ? { ...prev, is_resolved: true } : null);
    setRecoveryStatus('RECOVERED');
    setPaymentVerification(prev => prev ? { ...prev, status: 'PASSED', is_valid: true } : null);
    
    // Restore sender balance in simulated accounts
    setSimulatedAccounts(prev => prev.map(a => a.account_id === 'ACC-SENDER' ? { ...a, balance: 100000.0 } : a));

    setSystemMetrics((prev: any) => ({
      ...prev,
      autoRecovered: prev.autoRecovered + 1,
      anomaliesDetected: Math.max(0, prev.anomaliesDetected - 1),
    }));

    triggerConfetti();
    addToast({
      type: 'success',
      title: 'Incident Recovered Successfully',
      message: `✓ Balance restored to ₹100,000.00. Checkpoint ${activeIncident.checkpoint_id} verified. Status: SAFE.`,
    });

    return true;
  }, [activeIncident, addToast]);

  // Reset Active Incident
  const resetActiveIncident = useCallback(() => {
    setActiveIncident({ ...INITIAL_INCIDENT, is_resolved: false });
    setRecoveryStatus('SAFE');
    addToast({
      type: 'info',
      title: 'Incident Reset',
      message: 'Active demo incident reset to baseline contract state.',
    });
  }, [addToast]);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.85, x: 0.88 },
        colors: ['#4F46E5', '#10B981', '#6366F1', '#38BDF8'],
      });
    } catch {}
  };

  // Reset Payment Sandbox
  const resetPaymentSandbox = useCallback(async () => {
    try {
      await ApiService.resetPaymentDemo();
    } catch {}

    setSimulatedAccounts(INITIAL_SIMULATED_ACCOUNTS);
    setActiveTransaction(null);
    setPaymentVerification(null);
    setPaymentRecoveryPlan(null);
    setIsPaymentDemoRunning(false);
    setPaymentDemoStep(0);

    addToast({
      type: 'info',
      title: 'Payment Sandbox Reset',
      message: 'Simulated balances restored to baseline: Sender balance ₹100,000.',
    });
  }, [addToast]);

  // Initiate Custom Simulated Payment
  const initiateCustomPayment = useCallback(async (recipient: string, amount: number, fault: FaultInjectionType = 'NONE') => {
    let actualRec = recipient;
    let actualAmt = amount;
    let forceStatus = 'PENDING';

    if (fault === 'WRONG_RECIPIENT') {
      actualRec = 'Rakesh';
    } else if (fault === 'WRONG_AMOUNT') {
      actualAmt = amount + 5000;
    } else if (fault === 'COMPLETED_COMPENSATE') {
      actualRec = 'Rakesh';
      forceStatus = 'COMPLETED';
    }

    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const cpId = `CP-PAY-${Date.now().toString().slice(-4)}`;

    const newTxn: SimulatedTransaction = {
      transaction_id: txnId,
      sender_id: 'ACC-SENDER',
      sender_name: 'User (JD / Sender)',
      recipient_id: `ACC-${actualRec.toUpperCase().replace(/\s+/g, '')}`,
      recipient_name: actualRec,
      intended_recipient_name: recipient,
      amount: actualAmt,
      intended_amount: amount,
      currency: 'INR',
      status: forceStatus as any,
      risk_score: 95,
      checkpoint_id: cpId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      is_simulation: true,
    };

    // Deduct sender
    setSimulatedAccounts((prev) =>
      prev.map((acc) => {
        if (acc.account_id === 'ACC-SENDER') {
          return { ...acc, balance: acc.balance - actualAmt };
        }
        if (forceStatus === 'COMPLETED' && acc.name.toLowerCase().includes(actualRec.toLowerCase())) {
          return { ...acc, balance: acc.balance + actualAmt };
        }
        return acc;
      })
    );

    setActiveTransaction(newTxn);

    // Run independent verifier
    const isMismatch = actualRec !== recipient || actualAmt !== amount;
    const verif: PaymentVerificationResult = {
      status: isMismatch ? 'FAILED' : 'PASSED',
      is_valid: !isMismatch,
      mismatch_type: actualRec !== recipient ? 'DESTINATION_MISMATCH' : actualAmt !== amount ? 'AMOUNT_MISMATCH' : 'NONE',
      summary: isMismatch
        ? `Destination Mismatch: Intended recipient was '${recipient}', but transaction was directed to '${actualRec}'.`
        : `Payment verified: ₹${actualAmt.toLocaleString()} to ${actualRec}.`,
      expected_recipient: recipient,
      actual_recipient: actualRec,
      expected_amount: amount,
      actual_amount: actualAmt,
      differences: isMismatch ? [`Destination mismatch: intended '${recipient}', actual '${actualRec}'.`] : [],
      confidence: 0.99,
      risk_level: 'CRITICAL',
      risk_score: 95,
      recommended_recovery: forceStatus === 'COMPLETED' ? 'COMPENSATE' : 'CANCEL',
    };
    setPaymentVerification(verif);

    if (isMismatch) {
      setPaymentRecoveryPlan({
        strategy: forceStatus === 'COMPLETED' ? 'COMPENSATE' : 'CANCEL',
        reason: `State mismatch detected before settlement. Baseline checkpoint ${cpId} armed.`,
        transaction_id: txnId,
        target_checkpoint_id: cpId,
        estimated_recovery_time_sec: 0.5,
        recovery_confidence: 0.99,
        requires_human_approval: false,
        action_label: forceStatus === 'COMPLETED' ? 'Issue Compensating Refund' : 'Cancel Payment & Restore Balance',
        action_description: 'Restores reserved funds and reverts simulated accounts to checkpoint baseline.',
      });

      addToast({
        type: 'error',
        title: 'Payment Guardian Alert',
        message: `Independent Verifier caught mismatch: directed to ${actualRec} instead of ${recipient}!`,
      });
    } else {
      addToast({
        type: 'success',
        title: 'Payment Verified (Safe)',
        message: `Transaction state matches intended recipient '${recipient}'.`,
      });
    }
  }, [addToast]);

  // Execute Payment Recovery Action (Cancel / Compensate)
  const executePaymentRecovery = useCallback(async (): Promise<boolean> => {
    if (!activeTransaction) return false;

    addToast({
      type: 'info',
      title: 'Executing Recovery',
      message: `Cancelling ${activeTransaction.transaction_id} and restoring checkpoint ${activeTransaction.checkpoint_id}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Try backend API
    try {
      await ApiService.recoverPayment({
        transactionId: activeTransaction.transaction_id,
        strategy: paymentRecoveryPlan?.strategy || 'CANCEL',
      });
    } catch {}

    // Restore sender balance to 100,000
    setSimulatedAccounts((prev) =>
      prev.map((acc) => {
        if (acc.account_id === 'ACC-SENDER') {
          return { ...acc, balance: 100000.0 };
        }
        if (acc.account_id === 'ACC-RAKESH') {
          return { ...acc, balance: 30000.0 };
        }
        return acc;
      })
    );

    setActiveTransaction((prev) =>
      prev ? { ...prev, status: 'CANCELLED', recovery_strategy: 'CANCEL' } : null
    );

    setPaymentVerification({
      status: 'PASSED',
      is_valid: true,
      mismatch_type: 'NONE',
      summary: 'Post-recovery verification PASSED. All simulated balances cleanly restored.',
      expected_recipient: 'Sam',
      actual_recipient: 'Sam',
      expected_amount: 10000.0,
      actual_amount: 10000.0,
      differences: [],
      confidence: 0.99,
      risk_level: 'LOW',
      risk_score: 10,
      recommended_recovery: 'COMMIT',
    });

    // Add to audit log
    const newAudit: AuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      actionId: activeTransaction.transaction_id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agent: 'UNDO.AI Payment Guardian',
      action: `Cancelled Transaction & Restored ${activeTransaction.checkpoint_id}`,
      resource: 'ACC-SENDER (Simulated Balance)',
      risk: 'critical',
      status: 'Recovered',
      reversible: false,
      details: `Destination mismatch caught (Rakesh). Restored ₹${activeTransaction.amount.toLocaleString()} to sender account.`,
      ipHash: '127.0.0.1 (FinTech Sandbox)',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    addToast({
      type: 'success',
      title: 'Payment Cancelled & Restored',
      message: '✓ Reserved amount released ✓ Balance restored to ₹100,000 ✓ State verified.',
    });

    triggerConfetti();
    return true;
  }, [activeTransaction, paymentRecoveryPlan, addToast]);

  // Flagship 90-second Payment Guardian Demo Runner
  const runFlagshipPaymentDemo = useCallback(async () => {
    setIsPaymentDemoRunning(true);
    setActiveTab('payment');

    // Step 1: User Request
    setPaymentDemoStep(1);
    addToast({
      type: 'info',
      title: 'Step 1/10: User Request',
      message: '“Pay ₹10,000 to Sam.”',
    });
    await new Promise((r) => setTimeout(r, 1100));

    // Step 2: Expected Payment State Contract
    setPaymentDemoStep(2);
    addToast({
      type: 'info',
      title: 'Step 2/10: Expected State Formulated',
      message: 'Recipient: Sam | Amount: ₹10,000 | Status: COMPLETED.',
    });
    await new Promise((r) => setTimeout(r, 1100));

    // Step 3: Risk Engine
    setPaymentDemoStep(3);
    addToast({
      type: 'warning',
      title: 'Step 3/10: Risk Engine Evaluated',
      message: 'Score: 95/100 (CRITICAL) — External financial side effect.',
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Step 4: Checkpoint CP-PAY-001
    setPaymentDemoStep(4);
    addToast({
      type: 'success',
      title: 'Step 4/10: Checkpoint CP-PAY-001 Armed',
      message: 'Sender balance ₹100,000 snapshot captured.',
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Step 5 & 6: Initiate Payment with Wrong Recipient (Rakesh)
    setPaymentDemoStep(5);
    await initiateCustomPayment('Sam', 10000, 'WRONG_RECIPIENT');
    addToast({
      type: 'error',
      title: 'Step 6/10: Fault Injected',
      message: 'Agent initiated payment to Rakesh instead of Sam!',
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Step 7: Independent Verifier
    setPaymentDemoStep(7);
    addToast({
      type: 'error',
      title: 'Step 7/10: Independent Verifier Triggered',
      message: 'Mismatch detected! Expected: Sam | Actual: Rakesh.',
    });
    await new Promise((r) => setTimeout(r, 1400));

    // Step 8: Recovery Decision Engine
    setPaymentDemoStep(8);
    addToast({
      type: 'info',
      title: 'Step 8/10: Recovery Strategy Selected',
      message: 'Strategy: CANCEL (Pending payment, safe fund release).',
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Step 9 & 10: Cancel & Verified
    setPaymentDemoStep(9);
    await executePaymentRecovery();
    setPaymentDemoStep(10);
    addToast({
      type: 'success',
      title: 'Step 10/10: State Re-Verified',
      message: '✓ SYSTEM SAFE — Sender balance verified at ₹100,000.',
    });

    setIsPaymentDemoRunning(false);
    setPaymentDemoStep(0);
  }, [initiateCustomPayment, executePaymentRecovery, addToast]);

  // Generate Expected State Contract (Workspace)
  const generateExpectedState = useCallback(async (goal: string) => {
    try {
      const res = await ApiService.getExpectedState(goal);
      if (res) {
        setExpectedState(res);
      }
    } catch {}
  }, []);

  // Run Independent Verification (Workspace)
  const runIndependentVerification = useCallback(async (injectFailure = false): Promise<VerificationResult> => {
    setRecoveryStatus('WARNING');
    await new Promise((resolve) => setTimeout(resolve, 800));

    let result: VerificationResult;
    if (injectFailure || simulateFailure) {
      result = {
        status: 'FAILED',
        isValid: false,
        summary: 'Independent verification FAILED (1 state deviation detected).',
        differences: ['architecture.pdf was NOT relocated to /project/docs/architecture.pdf.'],
        confidence: 0.98,
        checkedInvariants: 8,
        passedInvariants: 7,
        failedInvariants: ['Invariant broken: /project/docs/architecture.pdf must exist.'],
        actualStateHash: '5e8b2a1c9f4d7e3a',
      };
      setRecoveryStatus('FAILED');
    } else {
      result = {
        status: 'PASSED',
        isValid: true,
        summary: 'Independent verification PASSED (8/8 state invariants verified).',
        differences: [],
        confidence: 0.98,
        checkedInvariants: 8,
        passedInvariants: 8,
        failedInvariants: [],
        actualStateHash: '9a4c8e1f0b2d3a7e',
      };
      setRecoveryStatus('SAFE');
    }

    setVerificationResult(result);
    return result;
  }, [simulateFailure]);

  // Intelligent Recovery (Workspace)
  const executeIntelligentRecovery = useCallback(async (): Promise<boolean> => {
    setRecoveryStatus('RECOVERING');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setActions((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'undone',
        rollbackAvailable: false,
        newStateDesc: `[Restored to safe baseline: ${a.previousStateDesc}]`,
      }))
    );

    setRecoveryStatus('RECOVERED');
    setVerificationResult({
      status: 'PASSED',
      isValid: true,
      summary: 'Post-recovery verification PASSED. System safely restored to baseline.',
      differences: [],
      confidence: 0.99,
      checkedInvariants: 8,
      passedInvariants: 8,
      failedInvariants: [],
      actualStateHash: '1a2b3c4d5e6f7a8b',
    });

    triggerConfetti();
    return true;
  }, []);

  // Main Undo Action Method
  const undoAction = useCallback(async (actionId: string): Promise<boolean> => {
    const targetAction = actions.find((a) => a.id === actionId);
    if (!targetAction || targetAction.status !== 'completed' || !targetAction.reversible) {
      addToast({
        type: 'error',
        title: 'Rollback Failed',
        message: 'This action is not currently reversible or already undone.',
      });
      return false;
    }

    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: 'rolling_back' } : a))
    );

    await new Promise((resolve) => setTimeout(resolve, 900));

    try {
      await ApiService.undoAction(actionId);
    } catch {}

    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'undone',
              rollbackAvailable: false,
              newStateDesc: `[Restored to: ${a.previousStateDesc}]`,
            }
          : a
      )
    );

    triggerConfetti();
    return true;
  }, [actions, addToast]);

  // Global Undo
  const undoLastAction = useCallback(async (): Promise<boolean> => {
    const latestReversible = actions.find(
      (a) => a.status === 'completed' && a.reversible && a.rollbackAvailable
    );

    if (!latestReversible) {
      addToast({
        type: 'info',
        title: 'No Actions to Undo',
        message: 'All recent agent actions are already in baseline or irreversible.',
      });
      return false;
    }

    return await undoAction(latestReversible.id);
  }, [actions, undoAction, addToast]);

  // Restore snapshot
  const restoreSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return false;

    addToast({
      type: 'info',
      title: 'Initiating Checkpoint Restore',
      message: `Restoring workspace to ${snap.name}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    setSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === snapshotId,
      }))
    );

    triggerConfetti();
    return true;
  }, [snapshots, addToast]);

  const togglePolicy = useCallback((policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, enabled: !p.enabled } : p))
    );
  }, []);

  const addNewAction = useCallback((newAction: Omit<AgentAction, 'id' | 'timestamp' | 'timeAgo'>) => {
    const id = `ACT-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullAction: AgentAction = {
      ...newAction,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timeAgo: 'Just now',
    };
    setActions((prev) => [fullAction, ...prev]);
  }, []);

  const resetToDefault = useCallback(async () => {
    try {
      await ApiService.resetDemo();
    } catch {}

    setActions(
      INITIAL_ACTIONS.map((a) => ({
        ...a,
        riskScore: a.risk === 'high' ? 80 : a.risk === 'medium' ? 45 : 20,
        checkpointId: 'CP-104',
        policyAction: a.risk === 'high' ? 'REQUIRE_STRONG_VERIFICATION' : 'AUTO_EXECUTE',
      }))
    );
    setSnapshots(INITIAL_SNAPSHOTS);
    setPolicies(INITIAL_POLICIES);
    setAuditLogs(INITIAL_AUDIT_LOG);
    setExpectedState(DEFAULT_EXPECTED_STATE);
    setVerificationResult(DEFAULT_VERIFICATION);
    setRecoveryStatus('SAFE');
    setIsDemoRunning(false);
  }, []);

  const runHackathonDemo = useCallback(async () => {
    setIsDemoRunning(true);
    setActiveTab('workspace');
    setDemoStep(1);
    await new Promise((r) => setTimeout(r, 1000));
    setDemoStep(5);
    await new Promise((r) => setTimeout(r, 1000));
    setDemoStep(7);
    await runIndependentVerification(true);
    await new Promise((r) => setTimeout(r, 1000));
    await executeIntelligentRecovery();
    setDemoStep(0);
    setIsDemoRunning(false);
  }, [runIndependentVerification, executeIntelligentRecovery]);

  const cancelDemo = useCallback(() => {
    setIsDemoRunning(false);
    setDemoStep(0);
  }, []);

  const stats = {
    activeAgents: 3,
    actionsToday: actions.length,
    reversibleActions: actions.filter((a) => a.reversible).length,
    undoneActions: actions.filter((a) => a.status === 'undone').length,
    undoSuccessRate: 100,
    avgRollbackTime: '0.8s',
    safeToUndoCount: actions.filter((a) => a.status === 'completed' && a.reversible && a.rollbackAvailable).length,
    failedRollbacks: 0,
    riskScore: liveAgent.riskScore || 24,
  };

  return (
    <AgentContext.Provider
      value={{
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        safeMode,
        setSafeMode,
        demoMode,
        setDemoMode,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        actions,
        snapshots,
        policies,
        auditLogs,
        liveAgent,
        requireApprovalIrreversible,
        setRequireApprovalIrreversible,
        expectedState,
        verificationResult,
        recoveryPlan,
        recoveryStatus,
        confidenceMetrics,
        simulateFailure,
        setSimulateFailure,
        simulatedAccounts,
        activeTransaction,
        paymentVerification,
        paymentRecoveryPlan,
        activeFault,
        setActiveFault,
        isPaymentDemoRunning,
        paymentDemoStep,
        runFlagshipPaymentDemo,
        executePaymentRecovery,
        initiateCustomPayment,
        resetPaymentSandbox,
        selectedDataset,
        setSelectedDataset,
        datasetBatches,
        currentBatchId,
        setCurrentBatchId,
        batchProcessingResult,
        isBatchProcessing,
        processCurrentBatch,
        activeIncident,
        setActiveIncident,
        isRecoveryPreviewOpen,
        setIsRecoveryPreviewOpen,
        executeIncidentRecovery,
        resetActiveIncident,
        systemMetrics,
        selectedActionForUndo,
        setSelectedActionForUndo,
        selectedActionForDetails,
        setSelectedActionForDetails,
        selectedSnapshotForPreview,
        setSelectedSnapshotForPreview,
        generateExpectedState,
        runIndependentVerification,
        executeIntelligentRecovery,
        undoAction,
        undoLastAction,
        restoreSnapshot,
        togglePolicy,
        addNewAction,
        resetToDefault,
        isDemoRunning,
        demoStep,
        runHackathonDemo,
        cancelDemo,
        toasts,
        addToast,
        removeToast,
        stats,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
