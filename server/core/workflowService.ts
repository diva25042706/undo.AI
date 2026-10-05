// ============================================================================
// UNDO.AI (AG02) — WORKFLOW ORCHESTRATION SERVICE
// Transactional Saga lifecycle, step execution, crash recovery, and state verifier
// ============================================================================

import { durableStore } from './durableStore.ts';
import { toolRegistry } from './toolRegistry.ts';
import { worldStateManager } from './mockWorld.ts';
import { stateVerifier } from './stateVerifier.ts';
import { recoveryCoordinator } from './recoveryCoordinator.ts';
import { emailService } from './emailService.ts';
import type {
  Customer,
  FaultInjectionType,
  WorkflowInstanceData,
  WorkflowStepSpec,
  WorkflowType,
} from './types.ts';

export class WorkflowService {
  constructor() {
    this.seedDefaultDemoWorkflow();
  }

  private seedDefaultDemoWorkflow() {
    const cabWf = this.createWorkflow('cab_booking', {
      pickup: 'Thiruvanmiyur',
      drop: 'OMR / Sholinganallur',
      fare: 420.0,
      currency: 'INR',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
      rideId: 'RIDE-CHN-4491',
    }, {
      name: 'Divakaran',
      email: 'divakaranperumal2007@gmail.com',
      phone: '+91 98400 12345',
    }, 'WF-CAB-CHN-001');

    // Pre-seed completed steps for the active UI scenario
    worldStateManager.getOrCreateWorldState('WF-CAB-CHN-001', 'cab_booking', cabWf.parameters);
  }

  public createWorkflow(
    workflowType: WorkflowType,
    parameters: Record<string, any> = {},
    customer: Customer = { name: 'Divakaran', email: 'divakaranperumal2007@gmail.com' },
    idOverride?: string
  ): WorkflowInstanceData {
    const workflowId = idOverride || `WF-${workflowType.toUpperCase().substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const steps = this.generateWorkflowSteps(workflowType);

    const instance: WorkflowInstanceData = {
      workflowId,
      workflowType,
      title: this.getWorkflowTitle(workflowType),
      customer,
      parameters,
      steps,
      currentStepIndex: 0,
      status: 'PENDING',
      faultConfiguration: 'NONE',
      requiresHuman: false,
      idempotencyKeys: new Set(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    durableStore.saveWorkflow(instance);
    worldStateManager.createInitialWorldState(workflowType, parameters);
    return instance;
  }

  public getWorkflow(workflowId: string): WorkflowInstanceData | undefined {
    return durableStore.getWorkflow(workflowId);
  }

  public getAllWorkflows(): WorkflowInstanceData[] {
    return durableStore.getAllWorkflows();
  }

  public getWorkflowLogs(workflowId: string) {
    return durableStore.getLogs(workflowId);
  }

  public verifyWorkflowState(workflowId: string) {
    const wf = durableStore.getWorkflow(workflowId);
    if (!wf) return null;

    const worldState = worldStateManager.getOrCreateWorldState(workflowId, wf.workflowType, wf.parameters);
    return stateVerifier.verifyWorldRestored(wf.workflowType, worldState, wf.parameters);
  }

  public async executeWorkflow(
    workflowId: string,
    fault: FaultInjectionType = 'NONE',
    executeAll: boolean = true
  ): Promise<{
    success: boolean;
    workflow: WorkflowInstanceData;
    executedSteps: string[];
    crashed: boolean;
    error?: string;
  }> {
    const wf = durableStore.getWorkflow(workflowId);
    if (!wf) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    wf.faultConfiguration = fault;
    wf.status = 'RUNNING';
    durableStore.saveWorkflow(wf);

    const worldState = worldStateManager.getOrCreateWorldState(workflowId, wf.workflowType, wf.parameters);
    const executedSteps: string[] = [];

    for (let i = wf.currentStepIndex; i < wf.steps.length; i++) {
      const step = wf.steps[i];
      const stepNumber = i + 1;

      // Check Fault Injection for Failure
      if (
        (fault === 'FAIL_STEP_1' && stepNumber === 1) ||
        (fault === 'FAIL_STEP_2' && stepNumber === 2) ||
        (fault === 'FAIL_STEP_3' && stepNumber === 3) ||
        (fault === 'FAIL_STEP_4' && stepNumber === 4) ||
        (fault === 'FAIL_STEP_5' && stepNumber === 5) ||
        (fault === 'FAIL_STEP_6' && stepNumber === 6)
      ) {
        console.warn(`[UNDO.AI] Fault injection triggered at step ${stepNumber}: ${step.tool}`);
        wf.status = 'FAILED';
        wf.currentStepIndex = i;
        durableStore.saveWorkflow(wf);

        durableStore.appendLog(workflowId, {
          id: `LOG-FAIL-${Date.now()}`,
          workflowId,
          stepId: step.stepId,
          action: step.name,
          idempotencyKey: `STEP-${workflowId}-${step.stepId}`,
          status: 'FAILED',
          error: `Simulated fault injected at step ${stepNumber}`,
          timestamp: new Date().toISOString(),
        });

        // In the Agent with an Undo Button model, failure pauses execution in FAILED state until UNDO LAST ACTION is triggered
        return {
          success: false,
          workflow: durableStore.getWorkflow(workflowId)!,
          executedSteps,
          crashed: false,
          error: `Execution failed at step ${stepNumber} (${step.name})`,
        };
      }

      // Check Fault Injection for Crash
      if (
        (fault === 'CRASH_AFTER_STEP_1' && stepNumber === 1) ||
        (fault === 'CRASH_AFTER_STEP_2' && stepNumber === 2) ||
        (fault === 'CRASH_AFTER_STEP_3' && stepNumber === 3) ||
        (fault === 'CRASH_AFTER_STEP_4' && stepNumber === 4)
      ) {
        // Execute this step first, then crash
        const toolDef = toolRegistry.getTool(step.tool);
        if (toolDef) {
          await toolDef.executeForward(wf.parameters, worldState);
          executedSteps.push(step.tool);
          durableStore.appendLog(workflowId, {
            id: `LOG-${Date.now()}-${step.stepId}`,
            workflowId,
            stepId: step.stepId,
            action: step.name,
            compensationAction: step.compensationAction,
            idempotencyKey: `STEP-${workflowId}-${step.stepId}`,
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
          });
        }

        wf.status = 'CRASHED';
        wf.currentStepIndex = i + 1;
        durableStore.saveWorkflow(wf);
        console.warn(`[UNDO.AI] Node crash simulated after step ${stepNumber}: ${step.tool}`);

        return {
          success: false,
          workflow: wf,
          executedSteps,
          crashed: true,
          error: `Simulated node process crash after step ${stepNumber}`,
        };
      }

      // Normal Step Execution
      const toolDef = toolRegistry.getTool(step.tool);
      if (!toolDef) {
        throw new Error(`Tool not found: ${step.tool}`);
      }

      const stepIdempotencyKey = `STEP-${workflowId}-${step.stepId}`;
      if (durableStore.hasIdempotencyKey(stepIdempotencyKey)) {
        executedSteps.push(step.tool);
        continue;
      }

      const stepRes = await toolDef.executeForward(wf.parameters, worldState);
      if (stepRes.success) {
        executedSteps.push(step.tool);
        durableStore.setIdempotencyResult(stepIdempotencyKey, stepRes);
        durableStore.appendLog(workflowId, {
          id: `LOG-${Date.now()}-${step.stepId}`,
          workflowId,
          stepId: step.stepId,
          action: step.name,
          compensationAction: step.compensationAction,
          idempotencyKey: stepIdempotencyKey,
          status: 'COMPLETED',
          sideEffectDetails: stepRes.sideEffectDetails,
          timestamp: new Date().toISOString(),
        });
        worldStateManager.setWorldState(workflowId, stepRes.worldState);
      }

      wf.currentStepIndex = i + 1;
      if (!executeAll) break;
    }

    if (wf.currentStepIndex >= wf.steps.length) {
      wf.status = 'COMPLETED';
    }
    durableStore.saveWorkflow(wf);

    return {
      success: wf.status === 'COMPLETED',
      workflow: wf,
      executedSteps,
      crashed: false,
    };
  }

  public async undoWorkflow(
    workflowId: string,
    reason: string = 'USER_REQUESTED_UNDO',
    idempotencyKeyOverride?: string,
    recipientEmail?: string
  ): Promise<{
    success: boolean;
    workflowId: string;
    status: string;
    compensatedSteps: string[];
    finalStateVerified: boolean;
    requiresHuman?: boolean;
    verification?: any;
    isDuplicate?: boolean;
    emailResult?: any;
  }> {
    const idempotencyKey = idempotencyKeyOverride || `UNDO-${workflowId}`;

    // Step 1: Check Idempotency Store (never refund / cancel twice!)
    if (durableStore.hasIdempotencyKey(idempotencyKey)) {
      console.log(`[UNDO.AI] Idempotent hit: Rollback already completed for ${idempotencyKey}`);
      const cached = durableStore.getIdempotencyResult(idempotencyKey);
      return {
        ...cached,
        isDuplicate: true,
      };
    }

    const wf = durableStore.getWorkflow(workflowId);
    if (!wf) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    wf.status = 'COMPENSATING';
    durableStore.saveWorkflow(wf);

    // Step 2: Execute compensations in strict reverse order
    const rollbackRes = await recoveryCoordinator.executeRollback(wf, reason);

    let emailRes: any = null;
    // Step 3: Trigger real email ONLY IF fully restored and invariants pass
    if (rollbackRes.success && rollbackRes.finalStateVerified) {
      emailRes = await emailService.sendRecoveryEmail(wf, recipientEmail);
    }

    const resultPayload = {
      success: rollbackRes.success,
      workflowId,
      status: rollbackRes.status,
      compensatedSteps: rollbackRes.compensatedSteps,
      finalStateVerified: rollbackRes.finalStateVerified,
      requiresHuman: rollbackRes.requiresHuman,
      verification: rollbackRes.verification,
      emailResult: emailRes,
    };

    // Cache in idempotency store
    durableStore.setIdempotencyResult(idempotencyKey, resultPayload);

    return resultPayload;
  }

  private generateWorkflowSteps(workflowType: WorkflowType): WorkflowStepSpec[] {
    switch (workflowType) {
      case 'cab_booking':
        return [
          { stepId: 'request_ride', name: 'Request Ride', tool: 'request_ride', description: 'Initiate ride dispatch', reversible: true, compensationAction: 'cancel_ride_request', sideEffectType: 'DISPATCH', riskLevel: 'LOW' },
          { stepId: 'assign_driver', name: 'Assign Driver', tool: 'assign_driver', description: 'Lock fleet driver allocation', reversible: true, compensationAction: 'release_driver', sideEffectType: 'DISPATCH', riskLevel: 'MEDIUM' },
          { stepId: 'reserve_cab', name: 'Reserve Cab', tool: 'reserve_cab', description: 'Generate trip manifest', reversible: true, compensationAction: 'cancel_ride', sideEffectType: 'DISPATCH', riskLevel: 'MEDIUM' },
          { stepId: 'charge_fare', name: 'Charge Fare', tool: 'charge_fare', description: 'Settle rider payment', reversible: true, compensationAction: 'refund_payment', sideEffectType: 'FINANCIAL', riskLevel: 'HIGH' },
          { stepId: 'dispatch_otp', name: 'Dispatch OTP', tool: 'dispatch_otp', description: 'Transmit rider security pin', reversible: false, compensationAction: null, sideEffectType: 'COMMUNICATION', riskLevel: 'LOW' },
        ];

      case 'hotel_booking':
        return [
          { stepId: 'search_hotels', name: 'Search Nearby Hotels', tool: 'search_hotels', description: 'Query nearby hotel availability', reversible: false, compensationAction: null, sideEffectType: 'READ_ONLY', riskLevel: 'LOW' },
          { stepId: 'select_room', name: 'Select Available Room', tool: 'select_room', description: 'Lock room selection from inventory', reversible: false, compensationAction: null, sideEffectType: 'READ_ONLY', riskLevel: 'LOW' },
          { stepId: 'reserve_room', name: 'Reserve Room', tool: 'reserve_room', description: 'Place guaranteed room reservation', reversible: true, compensationAction: 'cancel_room_booking', sideEffectType: 'INVENTORY', riskLevel: 'MEDIUM' },
          { stepId: 'charge_card', name: 'Charge Card', tool: 'charge_card', description: 'Process guest card payment', reversible: true, compensationAction: 'refund_payment', sideEffectType: 'FINANCIAL', riskLevel: 'HIGH' },
          { stepId: 'create_booking_ticket', name: 'Create Booking Ticket Voucher', tool: 'create_booking_ticket', description: 'Generate hotel voucher confirmation', reversible: false, compensationAction: null, sideEffectType: 'COMMUNICATION', riskLevel: 'MEDIUM' },
          { stepId: 'send_confirmation', name: 'Send Booking Confirmation', tool: 'send_confirmation', description: 'Dispatch confirmation email receipt', reversible: false, compensationAction: null, sideEffectType: 'COMMUNICATION', riskLevel: 'LOW' },
        ];

      case 'ecommerce_order':
        return [
          { stepId: 'validate_product', name: 'Validate Product & Price', tool: 'validate_product', description: 'Verify catalog listing and dynamic pricing', reversible: false, compensationAction: null, sideEffectType: 'READ_ONLY', riskLevel: 'LOW' },
          { stepId: 'create_order', name: 'Create Order Record', tool: 'create_order', description: 'Generate pending customer order', reversible: true, compensationAction: 'cancel_order', sideEffectType: 'INVENTORY', riskLevel: 'LOW' },
          { stepId: 'reserve_inventory', name: 'Reserve Warehouse Inventory', tool: 'reserve_inventory', description: 'Hold item stock from warehouse pool', reversible: true, compensationAction: 'release_inventory', sideEffectType: 'INVENTORY', riskLevel: 'MEDIUM' },
          { stepId: 'capture_payment', name: 'Capture Payment', tool: 'capture_payment', description: 'Process payment gateway settlement', reversible: true, compensationAction: 'refund_payment', sideEffectType: 'FINANCIAL', riskLevel: 'HIGH' },
          { stepId: 'generate_shipment_label', name: 'Generate Shipment Label', tool: 'generate_shipment_label', description: 'Generate carrier tracking and barcode label', reversible: false, compensationAction: null, sideEffectType: 'DISPATCH', riskLevel: 'MEDIUM' },
          { stepId: 'send_order_confirmation', name: 'Send Order Confirmation', tool: 'send_order_confirmation', description: 'Dispatch order tracking email receipt', reversible: false, compensationAction: null, sideEffectType: 'COMMUNICATION', riskLevel: 'LOW' },
        ];

      case 'customer_support':
        return [
          { stepId: 'fetch_account_status', name: 'Fetch Account & History', tool: 'fetch_account_status', description: 'Retrieve account tier and dispute history', reversible: false, compensationAction: null, sideEffectType: 'READ_ONLY', riskLevel: 'LOW' },
          { stepId: 'verify_customer_identity', name: 'Verify Identity & Authorization', tool: 'verify_customer_identity', description: 'Validate OTP and session token', reversible: false, compensationAction: null, sideEffectType: 'READ_ONLY', riskLevel: 'LOW' },
          { stepId: 'escalate_ticket_priority', name: 'Escalate Ticket Priority', tool: 'escalate_ticket_priority', description: 'Raise ticket priority to Tier 2 escalation queue', reversible: true, compensationAction: 'demote_ticket_priority', sideEffectType: 'INVENTORY', riskLevel: 'MEDIUM' },
          { stepId: 'assign_specialist_agent', name: 'Assign Specialist Agent', tool: 'assign_specialist_agent', description: 'Lock senior claims engineer allocation', reversible: true, compensationAction: 'unassign_specialist_agent', sideEffectType: 'DISPATCH', riskLevel: 'MEDIUM' },
          { stepId: 'issue_resolution_credit', name: 'Issue Resolution Credit', tool: 'issue_resolution_credit', description: 'Credit goodwill balance to wallet', reversible: false, compensationAction: null, sideEffectType: 'FINANCIAL', riskLevel: 'HIGH' },
          { stepId: 'send_ticket_resolution_notice', name: 'Send Resolution Notice', tool: 'send_ticket_resolution_notice', description: 'Dispatch customer satisfaction resolution email', reversible: false, compensationAction: null, sideEffectType: 'COMMUNICATION', riskLevel: 'LOW' },
        ];

      default:
        return [
          { stepId: 'reserve_inventory', name: 'Reserve Inventory', tool: 'reserve_inventory', description: 'Hold product stock', reversible: true, compensationAction: 'release_inventory', sideEffectType: 'INVENTORY', riskLevel: 'MEDIUM' },
          { stepId: 'process_order_payment', name: 'Process Payment', tool: 'process_order_payment', description: 'Debit card charge', reversible: true, compensationAction: 'refund_order_payment', sideEffectType: 'FINANCIAL', riskLevel: 'HIGH' },
        ];
    }
  }

  private getWorkflowTitle(workflowType: WorkflowType): string {
    switch (workflowType) {
      case 'cab_booking': return 'Cab / Ride Booking';
      case 'hotel_booking': return 'Luxury Hotel Reservation';
      case 'ecommerce_order': return 'E-Commerce Purchase';
      case 'delivery': return 'Parcel Delivery';
      case 'customer_support': return 'Support Ticket Escalation';
      case 'restaurant_reservation': return 'Restaurant Table Booking';
    }
  }
}

export const workflowService = new WorkflowService();
