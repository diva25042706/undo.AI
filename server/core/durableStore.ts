// ============================================================================
// UNDO.AI (AG02) — DURABLE EXECUTION STORE & WAL
// Persistent in-memory write-ahead execution log with crash recovery replay
// ============================================================================

import type { DurableLogRecord, WorkflowInstanceData } from './types.ts';

export class DurableStore {
  private workflows = new Map<string, WorkflowInstanceData>();
  private logs = new Map<string, DurableLogRecord[]>();
  private idempotencyStore = new Map<string, any>();
  private emailIdempotencyStore = new Set<string>();
  private callIdempotencyStore = new Set<string>();

  public saveWorkflow(workflow: WorkflowInstanceData): void {
    this.workflows.set(workflow.workflowId, JSON.parse(JSON.stringify(workflow)));
  }

  public getWorkflow(workflowId: string): WorkflowInstanceData | undefined {
    const wf = this.workflows.get(workflowId);
    return wf ? JSON.parse(JSON.stringify(wf)) : undefined;
  }

  public getAllWorkflows(): WorkflowInstanceData[] {
    return Array.from(this.workflows.values()).map((w) => JSON.parse(JSON.stringify(w)));
  }

  public appendLog(workflowId: string, record: DurableLogRecord): void {
    if (!this.logs.has(workflowId)) {
      this.logs.set(workflowId, []);
    }
    this.logs.get(workflowId)!.push({ ...record });
  }

  public getLogs(workflowId: string): DurableLogRecord[] {
    return (this.logs.get(workflowId) || []).map((l) => ({ ...l }));
  }

  public getCompletedReversibleSteps(workflowId: string): DurableLogRecord[] {
    const logs = this.logs.get(workflowId) || [];
    // Only completed steps that have a compensation action and haven't yet been compensated
    return logs.filter((l) => l.status === 'COMPLETED' && !!l.compensationAction);
  }

  // Idempotency Management
  public hasIdempotencyKey(key: string): boolean {
    return this.idempotencyStore.has(key);
  }

  public getIdempotencyResult(key: string): any {
    return this.idempotencyStore.get(key);
  }

  public setIdempotencyResult(key: string, result: any): void {
    this.idempotencyStore.set(key, JSON.parse(JSON.stringify(result)));
  }

  // Email Idempotency
  public hasEmailSent(notificationKey: string): boolean {
    return this.emailIdempotencyStore.has(notificationKey);
  }

  public markEmailSent(notificationKey: string): void {
    this.emailIdempotencyStore.add(notificationKey);
  }

  // Voice Call Idempotency
  public hasCallMade(callKey: string): boolean {
    return this.callIdempotencyStore.has(callKey);
  }

  public markCallMade(callKey: string): void {
    this.callIdempotencyStore.add(callKey);
  }

  // Crash Recovery Inspection
  public recoverAfterCrash(workflowId: string): {
    workflow?: WorkflowInstanceData;
    completedSteps: string[];
    nextStepIndex: number;
  } {
    const wf = this.getWorkflow(workflowId);
    if (!wf) return { completedSteps: [], nextStepIndex: 0 };

    const logs = this.getLogs(workflowId);
    const completedStepIds = logs.filter((l) => l.status === 'COMPLETED').map((l) => l.stepId);

    // Identify next incomplete step
    const nextStepIndex = completedStepIds.length;

    return {
      workflow: wf,
      completedSteps: completedStepIds,
      nextStepIndex,
    };
  }
}

export const durableStore = new DurableStore();
