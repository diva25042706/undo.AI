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
};

