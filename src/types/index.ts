export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ActionStatus = 
  | 'completed' 
  | 'rolling_back' 
  | 'undone' 
  | 'failed' 
  | 'pending_approval' 
  | 'in_progress'
  | 'recovering'
  | 'recovered';

export type ActionType = 
  | 'create_file'
  | 'move_file'
  | 'rename_file'
  | 'modify_file'
  | 'delete_file'
  | 'create_folder'
  | 'update_metadata'
  | 'api_call'
  | 'draft_email'
  | 'transaction';

export interface ExpectedStateItem {
  presence: 'EXISTS' | 'ABSENT';
  origin?: string;
  reason?: string;
  contains?: string;
  unchanged?: boolean;
}

export interface ExpectedState {
  goal: string;
  userIntent: string;
  expectedStateMap: Record<string, ExpectedStateItem>;
  constraints: string[];
  successCriteria: string[];
  affectedResources: string[];
  reversibility: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  policyAction: string;
  confidenceScores: {
    intentConfidence: number;
    planConfidence: number;
    verificationConfidence: number;
    overallConfidence: number;
  };
}

export interface VerificationDifference {
  resource: string;
  expected: string;
  actual: string;
  mismatchType: string;
  severity?: string;
}

export interface VerificationResult {
  status: 'PASSED' | 'FAILED' | 'PENDING';
  isValid: boolean;
  summary: string;
  differences: string[];
  detailedDifferences?: VerificationDifference[];
  confidence: number;
  checkedInvariants: number;
  passedInvariants: number;
  failedInvariants: string[];
  actualStateHash?: string;
}

export interface RecoveryPlan {
  recoveryStrategy: 'ROLLBACK' | 'CANCEL' | 'COMPENSATE' | 'HUMAN_ESCALATION';
  reason: string;
  targetCheckpointId?: string;
  affectedActions: string[];
  cascadeRollbackSequence: string[];
  estimatedRecoveryTimeSec: number;
  recoveryConfidence: number;
  requiresHumanConfirmation?: boolean;
}

export interface ConfidenceMetrics {
  intentConfidence: number;
  planConfidence: number;
  verificationConfidence: number;
  overallConfidence: number;
  humanReviewRecommended: boolean;
  warningMessage?: string;
  breakdownNotes: string[];
}

export interface AgentAction {
  id: string; // e.g. "ACT-92831"
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentRole: string;
  timestamp: string; // e.g. "10:43:02" or ISO
  timeAgo: string; // e.g. "2 minutes ago"
  type: ActionType;
  title: string;
  actionSummary: string;
  target: string;
  sourcePath?: string;
  destPath?: string;
  previousContent?: string;
  newContent?: string;
  previousStateDesc: string;
  newStateDesc: string;
  reason: string;
  risk: RiskLevel;
  riskScore?: number;
  policyAction?: string;
  status: ActionStatus;
  reversible: boolean;
  rollbackAvailable: boolean;
  impact: string;
  affectedFiles: string[];
  checkpointId?: string;
  snapshotId?: string;
  dependsOn?: string[];
  tags?: string[];
  executionDurationMs?: number;
}

export interface FileChangeItem {
  path: string;
  type: 'added' | 'modified' | 'removed' | 'moved';
  oldPath?: string;
  newPath?: string;
  size?: string;
  details: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  status?: 'added' | 'modified' | 'removed' | 'moved' | 'unchanged';
  size?: string;
}

export interface Snapshot {
  id: string; // e.g. "SNAP-04" or "CP-001"
  name: string; // "Snapshot #04"
  createdAt: string;
  relativeTime: string;
  actionsCount: number;
  filesChangedCount: number;
  status: string; // "Safe checkpoint"
  isCurrent: boolean;
  description: string;
  fileTreeBefore: FileNode[];
  fileTreeAfter: FileNode[];
  changes: FileChangeItem[];
  sha256?: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresApproval: boolean;
  category: 'file_ops' | 'communication' | 'finance' | 'system';
  policyTier?: string;
}

export interface AuditEntry {
  id: string;
  actionId: string;
  time: string;
  agent: string;
  action: string;
  resource: string;
  risk: RiskLevel;
  status: 'Completed' | 'Undone' | 'Pending' | 'Blocked' | 'Verified' | 'Recovered';
  reversible: boolean;
  details: string;
  ipHash?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

export interface LiveAgentState {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'Working...' | 'Idle' | 'Awaiting Approval' | 'Rolling back' | 'Paused' | 'Verifying' | 'Recovered';
  currentTask: string;
  currentAction: string;
  progress: number;
  activeSince: string;
  currentActionId?: string;
  riskScore: number;
  policyTier: string;
  checkpointId: string;
}

// Simulated FinTech Payment Types
export interface SimulatedAccount {
  account_id: string;
  name: string;
  balance: number;
  currency: string;
  status: string;
  avatar: string;
}

export interface SimulatedTransaction {
  transaction_id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  intended_recipient_name: string;
  amount: number;
  intended_amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'FAILED' | 'REQUIRES_HUMAN_REVIEW';
  risk_score: number;
  checkpoint_id: string;
  timestamp: string;
  failure_reason?: string;
  recovery_strategy?: string;
  compensated_by_id?: string;
  is_simulation: boolean;
}

export interface PaymentVerificationResult {
  status: 'PASSED' | 'FAILED';
  is_valid: boolean;
  mismatch_type: 'DESTINATION_MISMATCH' | 'AMOUNT_MISMATCH' | 'DUPLICATE_TRANSACTION' | 'NONE';
  summary: string;
  expected_recipient: string;
  actual_recipient: string;
  expected_amount: number;
  actual_amount: number;
  differences: string[];
  confidence: number;
  risk_level: string;
  risk_score: number;
  recommended_recovery: 'CANCEL' | 'COMPENSATE' | 'HUMAN_ESCALATION' | 'COMMIT';
}

export interface PaymentRecoveryPlan {
  strategy: 'CANCEL' | 'COMPENSATE' | 'HUMAN_ESCALATION';
  reason: string;
  transaction_id: string;
  target_checkpoint_id: string;
  estimated_recovery_time_sec: number;
  recovery_confidence: number;
  requires_human_approval: boolean;
  action_label: string;
  action_description: string;
}

export type FaultInjectionType = 
  | 'NONE'
  | 'WRONG_RECIPIENT'
  | 'WRONG_AMOUNT'
  | 'DUPLICATE'
  | 'COMPLETED_COMPENSATE'
  | 'IRREVERSIBLE';

export interface DatasetRecord {
  record_id: string;
  domain: string;
  scenario: string;
  customer_id: string;
  customer_name: string;
  phone_number: string;
  organization_id: string;
  agent_id: string;
  transaction_id: string;
  action_id: string;
  source: string;
  destination: string;
  amount: string;
  currency: string;
  expected_state: string;
  actual_state: string;
  risk_score: number | string;
  reversibility: string;
  transaction_status: string;
  verification_status: string;
  anomaly_type: string;
  recovery_strategy: string;
  checkpoint_id: string;
  batch_id: string;
  human_approval_required: boolean | string;
  created_at: string;
}

export interface DatasetBatch {
  batch_id: string;
  total_records: number;
  normal_records: number;
  anomaly_records: number;
  domains: string[];
  anomalies: Array<{
    record_id: string;
    transaction_id: string;
    anomaly_type: string;
    recovery_strategy: string;
  }>;
}

export interface BatchRecoveryIntervention {
  record_id: string;
  transaction_id: string;
  customer_name: string;
  amount: number;
  anomaly_type: string;
  expected_state: string;
  actual_state: string;
  verification_status: string;
  recovery_action: string;
  checkpoint_restored: string;
  post_recovery_status: string;
}

export interface BatchProcessingResult {
  batch_id: string;
  total_processed: number;
  verified_automatically: number;
  anomalies_detected: number;
  recovery_interventions: BatchRecoveryIntervention[];
  final_safe_state: string;
  message: string;
}

export interface ActiveIncident {
  transaction_id: string;
  expected_recipient: string;
  actual_recipient: string;
  expected_amount: number;
  actual_amount: number;
  expected_account: string;
  actual_account: string;
  expected_status: string;
  actual_status: string;
  risk_score: number;
  risk_level: string;
  blast_radius_label: string;
  blast_radius_fraction: string;
  recovery_strategy: string;
  recovery_confidence: number;
  checkpoint_id: string;
  is_resolved: boolean;
}

export type ActiveTab = 
  | 'landing'
  | 'dashboard'
  | 'payment'
  | 'workspace'
  | 'chennaidataset'
  | 'timeline'
  | 'undocenter'
  | 'snapshots'
  | 'policies'
  | 'auditlog'
  | 'settings';

