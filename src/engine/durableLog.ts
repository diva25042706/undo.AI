// ============================================================================
// UNDO.AI — DURABLE EXECUTION LOG & IDEMPOTENCY PERSISTENCE ENGINE
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

export type StepExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'STARTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'COMPENSATION_FAILED'
  | 'SKIPPED'
  | 'REQUIRES_HUMAN'
  | 'BLOCKED_FOR_APPROVAL'
  | 'VERIFIED'
  | 'SENT'
  | 'EMAIL_FAILED'
  | 'FULLY_RESTORED';

export type CompensationExecutionStatus =
  | 'NONE'
  | 'PENDING'
  | 'COMPENSATING'
  | 'COMPENSATED'
  | 'FAILED';

export interface DurableLogEntry {
  logId: string;
  workflowId: string;
  workflowType: string;
  stepNumber: number;
  stepId: string;
  title: string;
  toolName: string;
  action: string;
  input: Record<string, any>;
  output: Record<string, any> | null;
  status: StepExecutionStatus;
  timestamp: string;
  idempotencyKey: string;
  compensationAction: string | null;
  compensationStatus: CompensationExecutionStatus;
  retryCount: number;
  errorMessage: string | null;
  isCompensated: boolean;
  reversible: boolean;
  idempotent: boolean;
  requiresApproval: boolean;
  sideEffectDesc?: string;
  compensationDesc?: string;
  result?: any;
}

const STORAGE_KEY = 'undo_ai_durable_execution_log_v2';
const WORKFLOW_STATE_KEY = 'undo_ai_active_workflow_state_v2';

export class DurableExecutionLogEngine {
  private logs: DurableLogEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.logs = JSON.parse(raw);
      } else {
        this.logs = [];
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // ignore storage quota errors in edge environments
    }
  }

  public getAllLogs(): DurableLogEntry[] {
    return [...this.logs];
  }

  public getWorkflowLogs(workflowId: string): DurableLogEntry[] {
    return this.logs.filter((l) => l.workflowId === workflowId);
  }

  public appendOrUpdateEntry(entry: DurableLogEntry): void {
    const existingIndex = this.logs.findIndex((l) => l.logId === entry.logId);
    if (existingIndex >= 0) {
      this.logs[existingIndex] = { ...entry };
    } else {
      this.logs.unshift({ ...entry });
    }
    this.saveToStorage();
  }

  public updateEntryStatus(
    logId: string,
    status: StepExecutionStatus,
    updates: Partial<DurableLogEntry> = {}
  ): void {
    const item = this.logs.find((l) => l.logId === logId);
    if (item) {
      item.status = status;
      Object.assign(item, updates);
      this.saveToStorage();
    }
  }

  public checkIdempotency(
    idempotencyKey: string
  ): { isDuplicate: boolean; previousEntry: DurableLogEntry | null } {
    const found = this.logs.find(
      (l) => l.idempotencyKey === idempotencyKey && l.status === 'COMPLETED'
    );
    if (found) {
      return { isDuplicate: true, previousEntry: found };
    }
    return { isDuplicate: false, previousEntry: null };
  }

  public getLastCompletedStep(workflowId: string): DurableLogEntry | null {
    const completed = this.logs
      .filter((l) => l.workflowId === workflowId && l.status === 'COMPLETED')
      .sort((a, b) => b.stepNumber - a.stepNumber);
    return completed.length > 0 ? completed[0] : null;
  }

  public clearAllLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(WORKFLOW_STATE_KEY);
    } catch {
      // ignore
    }
  }

  public saveActiveWorkflowState(state: any): void {
    try {
      localStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  public getActiveWorkflowState(): any | null {
    try {
      const raw = localStorage.getItem(WORKFLOW_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const durableLogInstance = new DurableExecutionLogEngine();
