// ============================================================================
// UNDO.AI (AG02) — PRODUCTION CORE BACKEND TYPES
// ============================================================================

export type WorkflowType =
  | 'cab_booking'
  | 'hotel_booking'
  | 'ecommerce_order'
  | 'delivery'
  | 'customer_support'
  | 'restaurant_reservation';

export type WorkflowStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'FULLY_RESTORED'
  | 'COMPENSATION_FAILED'
  | 'REQUIRES_HUMAN'
  | 'CRASHED';

export type EmailDeliveryStatus =
  | 'EMAIL_PENDING'
  | 'EMAIL_SENDING'
  | 'EMAIL_SENT'
  | 'EMAIL_ACCEPTED'
  | 'EMAIL_DELIVERED'
  | 'EMAIL_DELIVERY_DELAYED'
  | 'EMAIL_BOUNCED'
  | 'EMAIL_COMPLAINED'
  | 'EMAIL_SUPPRESSED'
  | 'EMAIL_FAILED'
  | 'EMAIL_PROVIDER_NOT_CONFIGURED'
  | 'EMAIL_ALREADY_SENT';

export type VoiceCallStatus =
  | 'VOICE_PENDING'
  | 'VOICE_CALLING'
  | 'VOICE_RINGING'
  | 'VOICE_CONNECTED'
  | 'VOICE_IN_PROGRESS'
  | 'VOICE_COMPLETED'
  | 'VOICE_FAILED'
  | 'VOICE_NO_ANSWER'
  | 'VOICE_BUSY'
  | 'VOICE_BLOCKED'
  | 'VOICE_ALREADY_COMPLETED'
  | 'VOICE_PROVIDER_NOT_CONFIGURED';

export interface VoiceCallContext {
  workflowId: string;
  transactionId: string;
  customerName: string;
  customerPhone: string;
  maskedPhone: string;
  workflowType: string;
  failureStep?: string;
  failureReason?: string;
  recovered: boolean;
  finalVerification: string;
  refundedAmount: number;
  compensationActions: string[];
  emailStatus: string;
  callStatus: VoiceCallStatus;
  speechScript: string;
}

export type FaultInjectionType =
  | 'NONE'
  | 'FAIL_STEP_1'
  | 'FAIL_STEP_2'
  | 'FAIL_STEP_3'
  | 'FAIL_STEP_4'
  | 'FAIL_STEP_5'
  | 'FAIL_STEP_6'
  | 'CRASH_AFTER_STEP_1'
  | 'CRASH_AFTER_STEP_2'
  | 'CRASH_AFTER_STEP_3'
  | 'CRASH_AFTER_STEP_4'
  | 'FAIL_COMPENSATION'
  | 'DUPLICATE_REQUEST'
  | 'TIMEOUT';

export interface Customer {
  name: string;
  email: string;
  phone?: string;
  accountNumber?: string;
}

export interface WorkflowStepSpec {
  stepId: string;
  name: string;
  tool: string;
  description: string;
  reversible: boolean;
  compensationAction: string | null;
  sideEffectType: 'FINANCIAL' | 'INVENTORY' | 'DISPATCH' | 'COMMUNICATION' | 'READ_ONLY' | 'ESCROW';
  parameters?: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DurableLogRecord {
  id: string;
  workflowId: string;
  stepId: string;
  action: string;
  compensationAction?: string | null;
  idempotencyKey: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED' | 'COMPENSATION_FAILED' | 'SKIPPED';
  sideEffectDetails?: Record<string, any>;
  compensationDetails?: Record<string, any>;
  timestamp: string;
  durationMs?: number;
  error?: string;
}

export interface InvariantResult {
  name: string;
  resource: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface StateVerificationResult {
  verified: boolean;
  status: 'WORLD_RESTORED' | 'STATE_MISMATCH' | 'BASELINE_MATCH' | 'ACTIVE_TRANSACTION';
  invariants: InvariantResult[];
  checkedInvariants: number;
  passedInvariants: number;
  failedInvariants: string[];
  actualStateHash: string;
  timestamp: string;
}

export interface WorkflowInstanceData {
  workflowId: string;
  workflowType: WorkflowType;
  title: string;
  customer: Customer;
  parameters: Record<string, any>;
  steps: WorkflowStepSpec[];
  currentStepIndex: number;
  status: WorkflowStatus;
  faultConfiguration: FaultInjectionType;
  requiresHuman: boolean;
  failedCompensation?: string;
  escalationReason?: string;
  idempotencyKeys: Set<string>;
  createdAt: string;
  updatedAt: string;
}
