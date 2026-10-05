// ============================================================================
// UNDO.AI (AG02) — SAGA RECOVERY COORDINATOR
// Strict reverse-order compensation execution with human escalation
// ============================================================================

import { durableStore } from './durableStore.ts';
import { toolRegistry } from './toolRegistry.ts';
import { worldStateManager } from './mockWorld.ts';
import { stateVerifier } from './stateVerifier.ts';
import type { StateVerificationResult, WorkflowInstanceData } from './types.ts';

export interface RecoveryExecutionResult {
  success: boolean;
  workflowId: string;
  status: 'FULLY_RESTORED' | 'COMPENSATION_FAILED' | 'REQUIRES_HUMAN';
  compensatedSteps: string[];
  failedCompensation?: string;
  requiresHuman: boolean;
  error?: string;
  verification: StateVerificationResult;
  finalStateVerified: boolean;
}

export class RecoveryCoordinator {
  public async executeRollback(
    workflow: WorkflowInstanceData,
    reason: string = 'USER_REQUESTED_UNDO',
    forceFailCompensation: boolean = false
  ): Promise<RecoveryExecutionResult> {
    const workflowId = workflow.workflowId;
    console.log(`[UNDO.AI] Starting Saga rollback for workflow: ${workflowId}, Reason: ${reason}`);

    // Step 1: Read durable log to find completed steps with compensations
    const completedReversibleLogs = durableStore.getCompletedReversibleSteps(workflowId);
    // Reverse order for rollback
    const stepsToCompensate = [...completedReversibleLogs].reverse();

    const worldState = worldStateManager.getOrCreateWorldState(
      workflowId,
      workflow.workflowType,
      workflow.parameters
    );

    const compensatedSteps: string[] = [];
    let failureOccurred = false;
    let failedCompensationAction: string | undefined;
    let failureError: string | undefined;

    for (const log of stepsToCompensate) {
      const stepId = log.stepId;
      const toolDef = toolRegistry.getTool(stepId) || (log.compensationAction ? toolRegistry.getToolByCompensation(log.compensationAction) : undefined);

      if (!toolDef || !toolDef.executeCompensation) {
        console.warn(`[UNDO.AI] No compensation handler registered for step: ${stepId}`);
        continue;
      }

      const compensationAction = toolDef.compensationAction || `compensate_${stepId}`;
      const compIdempotencyKey = `COMP-${workflowId}-${stepId}`;

      // Check if already compensated
      if (durableStore.hasIdempotencyKey(compIdempotencyKey)) {
        console.log(`[UNDO.AI] Compensation for step ${stepId} already completed (idempotent skip).`);
        compensatedSteps.push(compensationAction);
        continue;
      }

      const shouldFailThisStep =
        forceFailCompensation ||
        workflow.faultConfiguration === 'FAIL_COMPENSATION' ||
        workflow.parameters.failCompensation;

      const startTime = Date.now();
      try {
        const compResult = await toolDef.executeCompensation(
          {
            ...workflow.parameters,
            failCompensation: shouldFailThisStep && compensationAction === 'release_driver',
          },
          worldState
        );

        if (compResult.success) {
          compensatedSteps.push(compensationAction);
          durableStore.setIdempotencyResult(compIdempotencyKey, compResult);
          durableStore.appendLog(workflowId, {
            id: `LOG-COMP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            workflowId,
            stepId,
            action: log.action,
            compensationAction,
            idempotencyKey: compIdempotencyKey,
            status: 'COMPENSATED',
            compensationDetails: compResult.sideEffectReversed,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          });
          worldStateManager.setWorldState(workflowId, compResult.worldState);
        } else {
          failureOccurred = true;
          failedCompensationAction = compensationAction;
          failureError = compResult.error || `Compensation failed for ${stepId}`;
          durableStore.appendLog(workflowId, {
            id: `LOG-COMP-FAIL-${Date.now()}`,
            workflowId,
            stepId,
            action: log.action,
            compensationAction,
            idempotencyKey: compIdempotencyKey,
            status: 'COMPENSATION_FAILED',
            error: failureError,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          });
          break;
        }
      } catch (err: any) {
        failureOccurred = true;
        failedCompensationAction = compensationAction;
        failureError = err.message || 'Unexpected exception during compensation';
        break;
      }
    }

    // Step 2: Verify World State independently
    const currentState = worldStateManager.getWorldState(workflowId) || worldState;
    const verification = stateVerifier.verifyWorldRestored(
      workflow.workflowType,
      currentState,
      workflow.parameters
    );

    if (failureOccurred || !verification.verified) {
      workflow.status = 'COMPENSATION_FAILED';
      workflow.requiresHuman = true;
      workflow.failedCompensation = failedCompensationAction;
      workflow.escalationReason = failureError || 'Final state verification failed invariants';
      durableStore.saveWorkflow(workflow);

      return {
        success: false,
        workflowId,
        status: 'COMPENSATION_FAILED',
        compensatedSteps,
        failedCompensation: failedCompensationAction,
        requiresHuman: true,
        error: failureError || 'Invariant verification mismatch',
        verification,
        finalStateVerified: false,
      };
    }

    workflow.status = 'FULLY_RESTORED';
    workflow.requiresHuman = false;
    workflow.failedCompensation = undefined;
    durableStore.saveWorkflow(workflow);

    return {
      success: true,
      workflowId,
      status: 'FULLY_RESTORED',
      compensatedSteps,
      requiresHuman: false,
      verification,
      finalStateVerified: true,
    };
  }
}

export const recoveryCoordinator = new RecoveryCoordinator();
