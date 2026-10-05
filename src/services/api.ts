import {
  AgentAction,
  Snapshot,
  PolicyRule,
  AuditEntry,
  ExpectedState,
  VerificationResult,
  RecoveryPlan,
  ConfidenceMetrics,
  SimulatedAccount,
  SimulatedTransaction,
  PaymentVerificationResult,
  PaymentRecoveryPlan,
  FaultInjectionType,
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    // Return null if server is unreachable
    return null;
  }
}

export const ApiService = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      return res.ok;
    } catch {
      return false;
    }
  },

  // Seed & Reset demo environment
  async resetDemo(): Promise<any> {
    return await safeFetch('/demo/reset', { method: 'POST' });
  },

  async runFullDemo(): Promise<any> {
    return await safeFetch('/demo/run-full-scenario', { method: 'POST' });
  },

  // Expected State
  async getExpectedState(goal: string, workspaceId?: string): Promise<ExpectedState | null> {
    const data = await safeFetch<any>('/recovery/expected-state', {
      method: 'POST',
      body: JSON.stringify({ goal, workspace_id: workspaceId }),
    });
    if (!data) return null;
    return {
      goal: data.goal,
      userIntent: data.user_intent,
      expectedStateMap: data.expected_state,
      constraints: data.constraints,
      successCriteria: data.success_criteria,
      affectedResources: data.affected_resources,
      reversibility: data.reversibility,
      riskLevel: data.risk_level?.toLowerCase() || 'low',
      riskScore: data.risk_score || 20,
      policyAction: data.policy_action || 'AUTO_EXECUTE',
      confidenceScores: {
        intentConfidence: data.confidence_scores?.intent_confidence || 0.95,
        planConfidence: data.confidence_scores?.plan_confidence || 0.90,
        verificationConfidence: data.confidence_scores?.verification_confidence || 0.98,
        overallConfidence: data.confidence_scores?.overall_confidence || 0.94,
      },
    };
  },

  // Independent Verification
  async verifyState(params: {
    workspaceId: string;
    expectedState?: Record<string, any>;
    goal?: string;
    simulateFailure?: boolean;
  }): Promise<VerificationResult | null> {
    const data = await safeFetch<any>('/recovery/verify', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: params.workspaceId,
        expected_state: params.expectedState,
        goal: params.goal,
        simulate_failure: params.simulateFailure || false,
      }),
    });
    if (!data) return null;
    return {
      status: data.status,
      isValid: data.is_valid,
      summary: data.summary,
      differences: data.differences || [],
      confidence: data.confidence || 0.98,
      checkedInvariants: data.checked_invariants || 0,
      passedInvariants: data.passed_invariants || 0,
      failedInvariants: data.failed_invariants || [],
      actualStateHash: data.actual_state_hash,
    };
  },

  // Recovery Execution
  async executeRecovery(params: {
    workspaceId: string;
    strategy?: string;
    targetCheckpointId?: string;
  }): Promise<any> {
    return await safeFetch('/recovery/execute', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: params.workspaceId,
        strategy: params.strategy || 'ROLLBACK',
        target_checkpoint_id: params.targetCheckpointId,
      }),
    });
  },

  // Undo API
  async undoAction(actionId: string): Promise<any> {
    return await safeFetch(`/undo/action/${actionId}`, { method: 'POST' });
  },

  async undoLastAction(workspaceId: string): Promise<any> {
    return await safeFetch(`/undo/workspace/${workspaceId}/last`, { method: 'POST' });
  },

  // Restore snapshot
  async restoreSnapshot(snapshotId: string): Promise<any> {
    return await safeFetch(`/snapshots/${snapshotId}/restore`, { method: 'POST' });
  },

  // ==========================================
  // PAYMENT GUARDIAN API
  // ==========================================
  async getSimulatedAccounts(): Promise<SimulatedAccount[] | null> {
    return await safeFetch<SimulatedAccount[]>('/payment/accounts');
  },

  async getSimulatedTransactions(): Promise<SimulatedTransaction[] | null> {
    return await safeFetch<SimulatedTransaction[]>('/payment/transactions');
  },

  async initiatePayment(params: {
    intendedRecipient: string;
    intendedAmount: number;
    faultInjection?: FaultInjectionType;
  }): Promise<SimulatedTransaction | null> {
    return await safeFetch<SimulatedTransaction>('/payment/initiate', {
      method: 'POST',
      body: JSON.stringify({
        intended_recipient: params.intendedRecipient,
        intended_amount: params.intendedAmount,
        fault_injection: params.faultInjection || 'NONE',
      }),
    });
  },

  async verifyPayment(params: {
    transactionId: string;
    intendedRecipient: string;
    intendedAmount: number;
  }): Promise<PaymentVerificationResult | null> {
    return await safeFetch<PaymentVerificationResult>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: params.transactionId,
        intended_recipient: params.intendedRecipient,
        intended_amount: params.intendedAmount,
      }),
    });
  },

  async recoverPayment(params: {
    transactionId: string;
    strategy: string;
  }): Promise<any> {
    return await safeFetch('/payment/recover', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: params.transactionId,
        strategy: params.strategy,
      }),
    });
  },

  async resetPaymentDemo(): Promise<any> {
    return await safeFetch('/payment/demo/reset', { method: 'POST' });
  },

  async runFlagshipPaymentDemo(): Promise<any> {
    return await safeFetch('/payment/demo/run-flagship', { method: 'POST' });
  },

  // ==========================================
  // SYNTHETIC BENCHMARK DATASET API
  // ==========================================
  async getDatasetSummary(): Promise<any> {
    return await safeFetch('/dataset/summary');
  },

  async getDatasetBatches(limit: number = 20): Promise<any> {
    return await safeFetch(`/dataset/batches?limit=${limit}`);
  },

  async getBatchRecords(batchId: string): Promise<any> {
    return await safeFetch(`/dataset/batch/${batchId}`);
  },

  async processBatch(batchId: string): Promise<any> {
    return await safeFetch(`/dataset/batch/${batchId}/process`, { method: 'POST' });
  },

  async getDemo20Records(): Promise<any> {
    return await safeFetch('/dataset/demo-20');
  },

  // ==========================================
  // TRANSACTIONAL SAGA UNDO & RESEND EMAIL API
  // ==========================================
  async triggerSagaUndo(
    workflowId: string,
    params: {
      customerName?: string;
      email?: string;
      idempotencyKey?: string;
      workflowName?: string;
      workflowType?: string;
      refundAmount?: number;
      currency?: string;
      transactionId?: string;
      compensatedSteps?: string[];
      parameters?: Record<string, any>;
    } = {}
  ): Promise<{
    success: boolean;
    workflow_id: string;
    status: string;
    refund_amount: number;
    compensated_steps: string[];
    is_duplicate?: boolean;
    message?: string;
    email: {
      recipient: string;
      customer_name: string;
      status: 'EMAIL_PENDING' | 'EMAIL_SENDING' | 'EMAIL_SENT' | 'EMAIL_ACCEPTED' | 'EMAIL_DELIVERED' | 'EMAIL_DELIVERY_DELAYED' | 'EMAIL_BOUNCED' | 'EMAIL_COMPLAINED' | 'EMAIL_SUPPRESSED' | 'EMAIL_FAILED' | 'EMAIL_PROVIDER_NOT_CONFIGURED' | 'EMAIL_ALREADY_SENT';
      message_id?: string;
      email_id?: string;
      stage?: string;
      stage_label?: string;
      timestamp?: string;
      error?: string;
      raw_response?: any;
    };
  } | null> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': params.idempotencyKey || `UNDO-${workflowId}`,
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          workflow_id: workflowId,
          status: 'PARTIALLY_RECOVERED',
          refund_amount: params.refundAmount || 750,
          compensated_steps: params.compensatedSteps || [],
          email: {
            recipient: params.email || 'divakaranperumal27@gmail.com',
            customer_name: params.customerName || 'Divakaran',
            status: 'EMAIL_FAILED',
            error: errJson.error || `Server responded with ${res.status}`,
          },
        };
      }
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        workflow_id: workflowId,
        status: 'PARTIALLY_RECOVERED',
        refund_amount: params.refundAmount || 750,
        compensated_steps: params.compensatedSteps || [],
        email: {
          recipient: params.email || 'divakaranperumal27@gmail.com',
          customer_name: params.customerName || 'Divakaran',
          status: 'EMAIL_FAILED',
          error: err.message || 'Network error reaching backend undo endpoint',
        },
      };
    }
  },

  async retryEmailNotification(
    workflowId: string,
    params: {
      customerName?: string;
      email?: string;
      workflowName?: string;
      workflowType?: string;
      refundAmount?: number;
      currency?: string;
      transactionId?: string;
      compensatedSteps?: string[];
      parameters?: Record<string, any>;
      forceRetry?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    workflow_id: string;
    email: {
      recipient: string;
      customer_name: string;
      status: 'EMAIL_PENDING' | 'EMAIL_SENDING' | 'EMAIL_SENT' | 'EMAIL_ACCEPTED' | 'EMAIL_DELIVERED' | 'EMAIL_DELIVERY_DELAYED' | 'EMAIL_BOUNCED' | 'EMAIL_COMPLAINED' | 'EMAIL_SUPPRESSED' | 'EMAIL_FAILED' | 'EMAIL_PROVIDER_NOT_CONFIGURED' | 'EMAIL_ALREADY_SENT';
      stage?: string;
      stage_label?: string;
      message_id?: string;
      email_id?: string;
      timestamp?: string;
      error?: string;
      raw_response?: any;
    };
  } | null> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/notify-retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // ==========================================
  // REAL RESEND EMAIL DIAGNOSTICS & STATUS
  // ==========================================
  async sendTestEmail(params: {
    recipient?: string;
    customerName?: string;
  } = {}): Promise<{
    success: boolean;
    stage: 'ENVIRONMENT_ERROR' | 'RESEND_API_ERROR' | 'EMAIL_ACCEPTED' | 'EMAIL_DELIVERED' | 'EMAIL_BOUNCED' | 'EMAIL_SUPPRESSED' | 'EMAIL_DELIVERY_DELAYED' | 'INVALID_RECIPIENT';
    stage_label: string;
    status: 'EMAIL_ACCEPTED' | 'EMAIL_DELIVERED' | 'EMAIL_FAILED' | 'EMAIL_PROVIDER_NOT_CONFIGURED';
    email_id?: string;
    recipient: string;
    customer_name: string;
    sender?: string;
    subject?: string;
    timestamp?: string;
    error?: string;
    diagnostic_tip?: string;
    raw_response?: any;
  } | null> {
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        stage: 'RESEND_API_ERROR',
        stage_label: 'B. RESEND API NETWORK ERROR',
        status: 'EMAIL_FAILED',
        recipient: params.recipient || 'divakaranperumal27@gmail.com',
        customer_name: params.customerName || 'Divakaran',
        error: err.message || 'Network error reaching test email endpoint',
      };
    }
  },

  async sendForwardConfirmationEmail(params: {
    workflowId: string;
    workflowType: string;
    customerName: string;
    recipient: string;
    parameters?: Record<string, any>;
  }): Promise<{
    success: boolean;
    workflow_id: string;
    email: {
      recipient: string;
      customer_name: string;
      status: 'EMAIL_SENT' | 'EMAIL_ACCEPTED' | 'EMAIL_FAILED' | 'EMAIL_PROVIDER_NOT_CONFIGURED';
      stage?: string;
      stage_label?: string;
      email_id?: string;
      message_id?: string;
      timestamp?: string;
      error?: string;
      diagnostic_tip?: string;
      raw_response?: any;
    };
  } | null> {
    try {
      const res = await fetch('/api/email/confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async checkEmailDeliveryStatus(emailId: string): Promise<{
    success: boolean;
    email_id: string;
    status: 'EMAIL_ACCEPTED' | 'EMAIL_DELIVERED' | 'EMAIL_DELIVERY_DELAYED' | 'EMAIL_BOUNCED' | 'EMAIL_SUPPRESSED' | 'EMAIL_COMPLAINED' | 'EMAIL_FAILED' | 'EMAIL_PROVIDER_NOT_CONFIGURED';
    stage_label?: string;
    last_event?: string;
    recipient?: string;
    sender?: string;
    subject?: string;
    created_at?: string;
    raw_response?: any;
    error?: string;
  } | null> {
    try {
      const res = await fetch(`/api/notifications/resend/status/${encodeURIComponent(emailId)}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  // ==========================================
  // WORKFLOW BACKEND ENGINE API
  // ==========================================
  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getWorkflowLogs(workflowId: string): Promise<any> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/log`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async verifyWorkflowInvariants(workflowId: string): Promise<any> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/verify`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async executeWorkflow(workflowId: string, faultInjection: string = 'NONE'): Promise<any> {
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faultInjection }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async runAcceptanceTests(): Promise<any> {
    try {
      const res = await fetch('/api/tests/run');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // ==========================================
  // GLM / ZHIPU AI PLANNING LAYER API
  // ==========================================
  async getAIConfig(): Promise<{
    status: string;
    provider: string;
    model: string;
    base_url: string;
    configured: boolean;
  } | null> {
    try {
      const res = await fetch('/api/ai/config');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async generateAIPlan(prompt: string, customer?: { name?: string; email?: string }): Promise<{
    success: boolean;
    model: string;
    provider: string;
    is_fallback: boolean;
    configured: boolean;
    plan: any;
    timestamp: string;
  } | null> {
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, customer }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // ==========================================
  // VOICE RECOVERY AGENT & EXOTEL API
  // ==========================================
  async triggerVoiceRecoveryCall(params: {
    workflowId: string;
    transactionId?: string;
    customerName?: string;
    customerPhone?: string;
    workflowType?: string;
    failureStep?: string;
    failureReason?: string;
    recovered?: boolean;
    finalVerification?: string;
    refundedAmount?: number;
    compensationActions?: string[];
    emailStatus?: string;
  }): Promise<{
    success: boolean;
    callId?: string;
    status: 'VOICE_PENDING' | 'VOICE_CALLING' | 'VOICE_RINGING' | 'VOICE_CONNECTED' | 'VOICE_IN_PROGRESS' | 'VOICE_COMPLETED' | 'VOICE_FAILED' | 'VOICE_NO_ANSWER' | 'VOICE_BUSY' | 'VOICE_BLOCKED' | 'VOICE_ALREADY_COMPLETED' | 'VOICE_PROVIDER_NOT_CONFIGURED';
    customerName: string;
    customerPhone: string;
    maskedPhone: string;
    speechScript: string;
    callDurationSeconds?: number;
    exotelSid?: string;
    error?: string;
    warning?: string;
    timestamp: string;
    context: any;
  } | null> {
    try {
      const res = await fetch('/api/voice/recovery-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async triggerVoiceConfirmationCall(params: {
    workflowId: string;
    customerName?: string;
    customerPhone?: string;
    workflowType?: string;
    parameters?: Record<string, any>;
  }): Promise<any> {
    try {
      const res = await fetch('/api/voice/confirmation-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getVoiceCallStatus(callId: string): Promise<any> {
    try {
      const res = await fetch(`/api/voice/status/${encodeURIComponent(callId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async askVoiceAssistant(params: { question: string; context: any }): Promise<{
    success: boolean;
    question: string;
    answer: string;
    timestamp: string;
  } | null> {
    try {
      const res = await fetch('/api/voice/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};



