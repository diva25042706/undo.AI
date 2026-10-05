// ============================================================================
// UNDO.AI — SAGA TRANSACTIONAL EXECUTION & RECOVERY ENGINE
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

import {
  WORKFLOW_DEFINITIONS,
  WorkflowType,
  WorkflowStepSpec,
  WorkflowInstance,
  generateWorkflowInstance,
  WorkflowCustomer,
  DEFAULT_CUSTOMER,
} from './workflows';
import { CompensationContract } from './compensationContracts';
import { MockWorldEngine, mockWorldEngineInstance, MockWorldState } from './mockWorld';
import {
  DurableExecutionLogEngine,
  durableLogInstance,
  DurableLogEntry,
} from './durableLog';
import { ApiService } from '../services/api';

export type FaultInjectionOption =
  | 'NONE'
  | 'FAIL_CREATE_BOOKING_TICKET'
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

export interface WorkflowRuntimeState {
  workflowId: string;
  workflowType: WorkflowType;
  instance: WorkflowInstance;
  name: string;
  status:
    | 'IDLE'
    | 'RUNNING'
    | 'COMPLETED'
    | 'FAILED'
    | 'COMPENSATING'
    | 'RECOVERED'
    | 'PARTIALLY_RECOVERED'
    | 'CRASHED'
    | 'AWAITING_APPROVAL';
  currentStepIndex: number;
  totalSteps: number;
  activeStep: WorkflowStepSpec | null;
  faultInjection: FaultInjectionOption;
  executionLogs: DurableLogEntry[];
  worldState: MockWorldState;
  baselineWorldState: MockWorldState;
  worldDifferences: Array<{ resource: string; expected: string; actual: string; isMatch: boolean }>;
  isWorldRestored: boolean;
  compensationSequence: string[];
  duplicatePreventedCount: number;
  lastError: string | null;
  requiresHumanEscalation: boolean;
  escalationReason: string | null;
  isSimulatedCrash: boolean;
  canResumeAfterCrash: boolean;
  awaitingApprovalStep: WorkflowStepSpec | null;
  emailNotification: {
    status:
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
    recipient: string;
    customerName: string;
    sender?: string;
    subject?: string;
    messageId?: string;
    emailId?: string;
    timestamp?: string;
    error?: string;
    stage?: string;
    stageLabel?: string;
    lastEvent?: string;
    rawResponse?: any;
  } | null;
  voiceCallNotification: {
    status:
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
    customerName: string;
    customerPhone: string;
    maskedPhone: string;
    callId?: string;
    speechScript?: string;
    callDurationSeconds?: number;
    timestamp?: string;
    error?: string;
    warning?: string;
    context?: any;
  } | null;
}

export type StateListener = (state: WorkflowRuntimeState) => void;

export class SagaExecutionEngine {
  private world: MockWorldEngine;
  private logEngine: DurableExecutionLogEngine;
  private state: WorkflowRuntimeState;
  private listeners: StateListener[] = [];
  private isAbortRequested: boolean = false;
  private stepDelayMs: number = 800;

  constructor(
    world: MockWorldEngine = mockWorldEngineInstance,
    logEngine: DurableExecutionLogEngine = durableLogInstance
  ) {
    this.world = world;
    this.logEngine = logEngine;
    const initialInstance = generateWorkflowInstance('cab_booking', {
      fare: 420.0,
      pickup: 'Thiruvanmiyur',
      drop: 'OMR / Sholinganallur',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
    });
    this.state = this.createInitialRuntimeState(initialInstance);
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public getState(): WorkflowRuntimeState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public setStepDelay(ms: number): void {
    this.stepDelayMs = ms;
  }

  public setFaultInjection(fault: FaultInjectionOption): void {
    this.state.faultInjection = fault;
    this.notify();
  }

  private createInitialRuntimeState(instance: WorkflowInstance): WorkflowRuntimeState {
    const worldState = this.world.initializeWorkflowWorld(instance);
    const baselineWorldState = this.world.getBaseline(instance.instanceId);

    return {
      workflowId: instance.instanceId,
      workflowType: instance.workflowType,
      instance,
      name: instance.name,
      status: 'IDLE',
      currentStepIndex: -1,
      totalSteps: instance.steps.length,
      activeStep: null,
      faultInjection: 'NONE',
      executionLogs: [],
      worldState,
      baselineWorldState,
      worldDifferences: [],
      isWorldRestored: true,
      compensationSequence: [],
      duplicatePreventedCount: 0,
      lastError: null,
      requiresHumanEscalation: false,
      escalationReason: null,
      isSimulatedCrash: false,
      canResumeAfterCrash: false,
      awaitingApprovalStep: null,
      emailNotification: null,
      voiceCallNotification: null,
    };
  }

  public selectWorkflow(
    type: WorkflowType,
    customParams?: Record<string, any>,
    customCustomer?: Partial<WorkflowCustomer>
  ): void {
    const instance = generateWorkflowInstance(type, customParams, customCustomer);
    this.state = this.createInitialRuntimeState(instance);
    this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
    this.notify();
  }

  public resetWorld(): void {
    const instance = this.state.instance;
    this.world.resetToBaseline(instance.instanceId);
    this.state.worldState = this.world.getState(instance.instanceId);
    this.state.baselineWorldState = this.world.getBaseline(instance.instanceId);
    this.state.worldDifferences = [];
    this.state.isWorldRestored = true;
    this.state.status = 'IDLE';
    this.state.currentStepIndex = -1;
    this.state.activeStep = null;
    this.state.lastError = null;
    this.state.requiresHumanEscalation = false;
    this.state.escalationReason = null;
    this.state.isSimulatedCrash = false;
    this.state.canResumeAfterCrash = false;
    this.state.awaitingApprovalStep = null;
    this.state.compensationSequence = [];
    this.notify();
  }

  // --- Main Saga Workflow Execution ---
  public async runWorkflow(
    workflowType?: WorkflowType,
    faultOption?: FaultInjectionOption,
    customParams?: Record<string, any>,
    customCustomer?: Partial<WorkflowCustomer>
  ): Promise<WorkflowRuntimeState> {
    const targetType = workflowType || this.state.workflowType;
    const isSameType = targetType === this.state.workflowType;
    const prevParams = isSameType ? this.state.instance.parameters : {};
    const instance = generateWorkflowInstance(
      targetType,
      { ...prevParams, ...(customParams || {}) },
      customCustomer || this.state.instance.customer
    );

    this.state = this.createInitialRuntimeState(instance);
    if (faultOption !== undefined) {
      this.state.faultInjection = faultOption;
    }

    this.state.status = 'RUNNING';
    this.state.lastError = null;
    this.state.requiresHumanEscalation = false;
    this.state.escalationReason = null;
    this.state.isSimulatedCrash = false;
    this.state.canResumeAfterCrash = false;
    this.state.awaitingApprovalStep = null;
    this.state.duplicatePreventedCount = 0;
    this.isAbortRequested = false;

    this.world.setBaseline(this.world.getState(instance.instanceId), instance.instanceId);
    this.state.baselineWorldState = this.world.getBaseline(instance.instanceId);
    this.notify();

    const completedSteps: WorkflowStepSpec[] = [];

    for (let i = 0; i < instance.steps.length; i++) {
      if (this.isAbortRequested) break;

      const step = instance.steps[i];
      this.state.currentStepIndex = i;
      this.state.activeStep = step;
      this.notify();

      // Check Human Approval requirement for irreversible actions
      if (step.contract.requiresApproval) {
        this.state.status = 'AWAITING_APPROVAL';
        this.state.awaitingApprovalStep = step;
        this.notify();

        const approved = await this.waitForApprovalOrAutoResolve();
        if (!approved) {
          this.state.status = 'FAILED';
          this.state.lastError = `Irreversible action '${step.title}' was rejected during human review. Triggering saga rollback.`;
          this.notify();
          await this.executeReverseCompensation(completedSteps);
          return this.getState();
        }
        this.state.status = 'RUNNING';
        this.state.awaitingApprovalStep = null;
        this.notify();
      }

      await this.sleep(this.stepDelayMs);

      // Check Idempotency Token
      const idempotencyKey = `${instance.instanceId}_step_${step.stepNumber}_${step.toolName}`;
      const idempotencyCheck = this.logEngine.checkIdempotency(idempotencyKey);

      if (idempotencyCheck.isDuplicate && idempotencyCheck.previousEntry) {
        this.state.duplicatePreventedCount += 1;
        this.logEngine.appendOrUpdateEntry({
          ...idempotencyCheck.previousEntry,
          timestamp: new Date().toLocaleTimeString(),
          sideEffectDesc: `IDEMPOTENCY GUARD: Prevented duplicate execution for key '${idempotencyKey}'. Reused committed output.`,
        });
        completedSteps.push(step);
        this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
        this.notify();
        continue;
      }

      // Dynamic Fault Injections for Any Step Index
      const isCreateTicketStep =
        step.toolName === 'create_booking_ticket' ||
        (instance.workflowType === 'hotel_booking' && step.stepNumber === 5);

      const shouldFailThisStep =
        (this.state.faultInjection === 'FAIL_CREATE_BOOKING_TICKET' && isCreateTicketStep) ||
        (this.state.faultInjection === 'FAIL_STEP_1' && step.stepNumber === 1) ||
        (this.state.faultInjection === 'FAIL_STEP_2' && step.stepNumber === 2) ||
        (this.state.faultInjection === 'FAIL_STEP_3' && step.stepNumber === 3) ||
        (this.state.faultInjection === 'FAIL_STEP_4' && step.stepNumber === 4) ||
        (this.state.faultInjection === 'FAIL_STEP_5' && step.stepNumber === 5) ||
        (this.state.faultInjection === 'FAIL_STEP_6' && step.stepNumber === 6) ||
        (this.state.faultInjection === 'TIMEOUT' && step.stepNumber === 3);

      if (shouldFailThisStep) {
        console.log(`[FAULT INJECTION] ${this.state.faultInjection}`);
        console.log(`[TOOL] ${step.toolName}`);
        console.log(`[STATUS] FAILED`);
        console.log(`[SIDE EFFECT] NOT_APPLIED`);
        console.log(`[RECOVERY] Waiting for user to press UNDO LAST ACTION`);

        let failureErrorCode = 'STEP_EXECUTION_FAILURE';
        let failureReason = `Fault Injected: Simulated exception at step ${step.stepNumber} (${step.title}).`;
        let failureOutput: any = null;

        if (step.toolName === 'create_booking_ticket' || (instance.workflowType === 'hotel_booking' && step.stepNumber === 5)) {
          failureErrorCode = 'BOOKING_TICKET_SERVICE_FAILURE';
          failureReason = 'Booking ticket service failure';
          failureOutput = {
            success: false,
            status: 'FAILED',
            errorCode: 'BOOKING_TICKET_SERVICE_FAILURE',
            message: 'Booking ticket service failure',
            ticketId: null,
            sideEffectApplied: false,
          };
        } else if (step.toolName === 'generate_shipment_label' || (instance.workflowType === 'ecommerce_order' && step.stepNumber === 5)) {
          failureErrorCode = 'SHIPMENT_LABEL_SERVICE_FAILURE';
          failureReason = 'Shipment label service failure';
          failureOutput = {
            success: false,
            status: 'FAILED',
            errorCode: 'SHIPMENT_LABEL_SERVICE_FAILURE',
            message: 'Shipment label service failure',
            shipmentLabelId: null,
            sideEffectApplied: false,
          };
        } else if (step.toolName === 'issue_resolution_credit' || (instance.workflowType === 'customer_support' && step.stepNumber === 5)) {
          failureErrorCode = 'RESOLUTION_CREDIT_SERVICE_FAILURE';
          failureReason = 'Resolution credit service failure';
          failureOutput = {
            success: false,
            status: 'FAILED',
            errorCode: 'RESOLUTION_CREDIT_SERVICE_FAILURE',
            message: 'Resolution credit service failure',
            creditId: null,
            sideEffectApplied: false,
          };
        }

        const failedLogEntry: DurableLogEntry = {
          logId: `LOG-${Date.now()}-${step.stepNumber}`,
          workflowId: instance.instanceId,
          workflowType: instance.workflowType,
          stepNumber: step.stepNumber,
          stepId: step.stepId,
          title: step.title,
          toolName: step.toolName,
          action: step.contract.action,
          input: step.params,
          output: failureOutput,
          status: 'FAILED',
          timestamp: new Date().toLocaleTimeString(),
          idempotencyKey,
          compensationAction: null,
          compensationStatus: 'NONE',
          retryCount: 1,
          errorMessage: failureReason,
          isCompensated: false,
          reversible: false, // Step failed; no successful side effect to reverse for this step
          idempotent: step.contract.idempotent,
          requiresApproval: step.contract.requiresApproval,
          sideEffectDesc: failureOutput?.message
            ? `${failureOutput.message}. 0 side effects committed.`
            : `Execution failed at step ${step.stepNumber}. No side effects committed for this step.`,
        };
        this.logEngine.appendOrUpdateEntry(failedLogEntry);

        // Explicitly record subsequent downstream steps as SKIPPED in the durable log
        for (let j = i + 1; j < instance.steps.length; j++) {
          const skippedStep = instance.steps[j];
          const skippedLogEntry: DurableLogEntry = {
            logId: `LOG-${Date.now()}-${skippedStep.stepNumber}`,
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            stepNumber: skippedStep.stepNumber,
            stepId: skippedStep.stepId,
            title: skippedStep.title,
            toolName: skippedStep.toolName,
            action: skippedStep.contract.action,
            input: skippedStep.params,
            output: null,
            status: 'SKIPPED',
            timestamp: new Date().toLocaleTimeString(),
            idempotencyKey: `${instance.instanceId}_step_${skippedStep.stepNumber}_${skippedStep.toolName}`,
            compensationAction: null,
            compensationStatus: 'NONE',
            retryCount: 0,
            errorMessage: null,
            isCompensated: false,
            reversible: skippedStep.contract.reversible,
            idempotent: skippedStep.contract.idempotent,
            requiresApproval: skippedStep.contract.requiresApproval,
            sideEffectDesc: `Step ${skippedStep.stepNumber} skipped due to upstream failure at Step ${step.stepNumber}. 0 side effects committed.`,
          };
          this.logEngine.appendOrUpdateEntry(skippedLogEntry);
        }

        this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
        this.state.status = 'FAILED';
        this.state.lastError = failedLogEntry.errorMessage;
        const verification = this.world.verifyWorldState(instance.instanceId, 'FAILED');
        this.state.worldDifferences = verification.differences;
        this.state.isWorldRestored = false;
        this.notify();

        // Halt on failure so the user/operator can inspect partial state and click UNDO LAST ACTION
        return this.getState();
      }

      // Check Crash Points
      const shouldCrashAfterThisStep =
        (this.state.faultInjection === 'CRASH_AFTER_STEP_1' && step.stepNumber === 1) ||
        (this.state.faultInjection === 'CRASH_AFTER_STEP_2' && step.stepNumber === 2) ||
        (this.state.faultInjection === 'CRASH_AFTER_STEP_3' && step.stepNumber === 3) ||
        (this.state.faultInjection === 'CRASH_AFTER_STEP_4' && step.stepNumber === 4);

      // Execute Forward Side Effect in Mock World
      const execResult = this.world.executeAction(step.toolName, step.params, instance.instanceId);
      this.state.worldState = execResult.newState;

      // If this is the forward email confirmation step (authorized by human), trigger the real Resend email
      const isForwardConfirmationEmailStep =
        step.toolName === 'send_booking_confirmation' ||
        step.toolName === 'send_order_confirmation' ||
        step.toolName === 'send_support_notification' ||
        step.toolName === 'send_confirmation' ||
        step.contract.category === 'notification';

      if (isForwardConfirmationEmailStep) {
        // 1. INSTANT ZERO-LATENCY VOICE TRIGGER (Rings Immediately)
        const customerPhone = instance.customer.phone || '9150390667';
        const maskedPhone = '******' + customerPhone.slice(-4);
        const immediateCallId = `CALL-INSTANT-${Date.now()}`;

        this.state.voiceCallNotification = {
          status: 'VOICE_RINGING',
          customerName: instance.customer.name,
          customerPhone,
          maskedPhone,
          callId: immediateCallId,
          speechScript: `Hello ${instance.customer.name}, your transaction has been officially approved and confirmed!`,
        };
        this.state.emailNotification = {
          status: 'EMAIL_SENDING',
          recipient: instance.customer.email,
          customerName: instance.customer.name,
        };
        this.notify();

        // 2. PARALLEL CONCURRENT DISPATCH (Twilio Call + Resend Email)
        Promise.allSettled([
          // A. Real Outbound Telecom Voice Call
          ApiService.triggerVoiceConfirmationCall({
            workflowId: instance.instanceId,
            customerName: instance.customer.name,
            customerPhone,
            workflowType: instance.workflowType,
            parameters: {
              ...instance.parameters,
              ...step.params,
            },
          }).then((voiceConfirmRes) => {
            if (voiceConfirmRes) {
              this.state.voiceCallNotification = {
                status: voiceConfirmRes.status,
                customerName: voiceConfirmRes.customerName,
                customerPhone: voiceConfirmRes.customerPhone,
                maskedPhone: voiceConfirmRes.maskedPhone,
                callId: voiceConfirmRes.callId || immediateCallId,
                speechScript: voiceConfirmRes.speechScript,
                callDurationSeconds: voiceConfirmRes.callDurationSeconds,
                timestamp: voiceConfirmRes.timestamp,
                error: voiceConfirmRes.error,
                warning: voiceConfirmRes.warning,
                context: voiceConfirmRes.context,
              };
              this.notify();
            }
          }).catch((err) => console.error('[VOICE] Call dispatch error:', err)),

          // B. Real Resend Email
          ApiService.sendForwardConfirmationEmail({
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            customerName: instance.customer.name,
            recipient: instance.customer.email,
            parameters: {
              ...instance.parameters,
              ...step.params,
              bookingId: this.state.worldState.hotel?.activeBookingId || instance.parameters.bookingId,
              ticketId: this.state.worldState.hotel?.ticketId || instance.parameters.ticketId || this.state.worldState.support?.ticketId,
              orderId: this.state.worldState.order?.orderId || instance.parameters.orderId,
              productName: this.state.worldState.order?.product || instance.parameters.productName || 'AI Dev Workstation Laptop',
              deliveryArea: instance.parameters.deliveryArea || 'Velachery, Chennai',
              specialist: this.state.worldState.support?.assignedAgent || 'Murugan K (Senior Specialist)',
              creditAmount: this.state.worldState.support?.resolutionCredit || instance.parameters.creditAmount || 500,
              driverName: this.state.worldState.cab?.driverName || instance.parameters.driverName || 'Murugan K',
              pickup: this.state.worldState.cab?.pickup || instance.parameters.pickup || 'Thiruvanmiyur',
              drop: this.state.worldState.cab?.drop || instance.parameters.drop || 'OMR / Sholinganallur',
              price: instance.parameters.price || 85000,
              roomPrice: instance.parameters.roomPrice || 750,
              fare: instance.parameters.fare || 420,
            },
          }).then((forwardEmailResult) => {
            if (forwardEmailResult?.email) {
              const emailId = forwardEmailResult.email.email_id || forwardEmailResult.email.message_id || 'RESEND-ACCEPTED';
              const mappedStatus =
                forwardEmailResult.email.status === 'EMAIL_SENT'
                  ? 'EMAIL_SENT'
                  : forwardEmailResult.email.status === 'EMAIL_ACCEPTED'
                  ? 'EMAIL_ACCEPTED'
                  : forwardEmailResult.email.status === 'EMAIL_PROVIDER_NOT_CONFIGURED'
                  ? 'EMAIL_PROVIDER_NOT_CONFIGURED'
                  : 'EMAIL_FAILED';

              this.state.emailNotification = {
                status: mappedStatus,
                recipient: forwardEmailResult.email.recipient,
                customerName: forwardEmailResult.email.customer_name,
                messageId: emailId,
                emailId: emailId,
                stage: forwardEmailResult.email.stage || 'EMAIL_ACCEPTED',
                stageLabel: forwardEmailResult.email.stage_label || 'C. EMAIL ACCEPTED BY RESEND',
                timestamp: forwardEmailResult.email.timestamp || new Date().toISOString(),
                error: forwardEmailResult.email.error,
                rawResponse: forwardEmailResult.email.raw_response,
              };
              this.notify();
            }
          }).catch((err) => console.error('[EMAIL] Email dispatch error:', err)),
        ]);

        const voiceConfirmLog: DurableLogEntry = {
          logId: `LOG-VOICE-CONFIRM-${Date.now()}`,
          workflowId: instance.instanceId,
          workflowType: instance.workflowType,
          stepNumber: step.stepNumber,
          stepId: 'STEP-VOICE-CONFIRMATION-CALL',
          title: `Outbound Confirmation Call (VOICE_RINGING)`,
          toolName: 'voice_recovery_service',
          action: 'VOICE_CONFIRMATION_CALL',
          input: { customerPhone: maskedPhone, customerName: instance.customer.name },
          output: { status: 'VOICE_RINGING', callId: immediateCallId },
          status: 'COMPLETED',
          timestamp: new Date().toLocaleTimeString(),
          idempotencyKey: `CONFIRM_${instance.instanceId}_VOICE_CALL`,
          compensationAction: null,
          compensationStatus: 'NONE',
          retryCount: 0,
          errorMessage: null,
          isCompensated: false,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          sideEffectDesc: `Voice Confirmation Agent triggered instant call to ${maskedPhone}.`,
        };
        this.logEngine.appendOrUpdateEntry(voiceConfirmLog);
      }

      // Durable Log Commit
      const completedLogEntry: DurableLogEntry = {
        logId: `LOG-${Date.now()}-${step.stepNumber}`,
        workflowId: instance.instanceId,
        workflowType: instance.workflowType,
        stepNumber: step.stepNumber,
        stepId: step.stepId,
        title: step.title,
        toolName: step.toolName,
        action: step.contract.action,
        input: step.params,
        output: execResult.output,
        status: 'COMPLETED',
        timestamp: new Date().toLocaleTimeString(),
        idempotencyKey,
        compensationAction: step.contract.compensationAction,
        compensationStatus: 'PENDING',
        retryCount: 0,
        errorMessage: null,
        isCompensated: false,
        reversible: step.contract.reversible,
        idempotent: step.contract.idempotent,
        requiresApproval: step.contract.requiresApproval,
        sideEffectDesc: execResult.sideEffectDesc,
      };

      this.logEngine.appendOrUpdateEntry(completedLogEntry);
      completedSteps.push(step);
      this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
      this.notify();

      if (shouldCrashAfterThisStep) {
        this.state.status = 'CRASHED';
        this.state.isSimulatedCrash = true;
        this.state.canResumeAfterCrash = true;
        this.state.lastError = `CRASH DETECTED: Agent host container terminated after Step ${step.stepNumber}. Durable checkpoint preserved in persistent log.`;
        this.logEngine.saveActiveWorkflowState({
          workflowId: instance.instanceId,
          workflowType: instance.workflowType,
          lastCompletedStep: step.stepNumber,
          faultInjection: this.state.faultInjection,
        });
        this.notify();
        return this.getState();
      }
    }

    // All steps executed successfully
    this.state.status = 'COMPLETED';
    this.state.activeStep = null;
    const verification = this.world.verifyWorldState(instance.instanceId, 'COMPLETED');
    this.state.worldDifferences = verification.differences;
    this.state.isWorldRestored = false;
    this.notify();

    return this.getState();
  }

  // --- Saga Reverse Compensation ---
  public async executeReverseCompensation(
    stepsToCompensate: WorkflowStepSpec[]
  ): Promise<void> {
    const instance = this.state.instance;

    // Idempotency & Duplicate Protection: Prevent double rollback / double refund
    if (this.state.status === 'RECOVERED' || this.state.isWorldRestored) {
      this.state.duplicatePreventedCount += 1;
      const duplicateLog: DurableLogEntry = {
        logId: `LOG-DUP-${Date.now()}`,
        workflowId: instance.instanceId,
        workflowType: instance.workflowType,
        stepNumber: 0,
        stepId: 'STEP-DUPLICATE-UNDO',
        title: 'Duplicate UNDO Request Prevented',
        toolName: 'idempotency_guardian',
        action: 'DUPLICATE_UNDO_PREVENTED',
        input: { workflowId: instance.instanceId },
        output: { status: 'RECOVERY_ALREADY_COMPLETED' },
        status: 'COMPLETED',
        timestamp: new Date().toLocaleTimeString(),
        idempotencyKey: `UNDO_${instance.instanceId}_DUP_${this.state.duplicatePreventedCount}`,
        compensationAction: null,
        compensationStatus: 'NONE',
        retryCount: 0,
        errorMessage: null,
        isCompensated: false,
        reversible: false,
        idempotent: true,
        requiresApproval: false,
        sideEffectDesc: 'Workflow is already in FULLY_RESTORED state. Compensation re-execution suppressed to prevent duplicate refunds.',
      };
      this.logEngine.appendOrUpdateEntry(duplicateLog);
      this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
      this.notify();
      return;
    }

    this.state.status = 'COMPENSATING';
    const reverseOrder = [...stepsToCompensate].reverse();
    this.state.compensationSequence = reverseOrder.map(
      (s) => s.contract.compensationAction || `skip_${s.toolName}`
    );
    this.state.emailNotification = null;

    console.log('[RECOVERY] Reading durable execution log');
    const successfulSideEffects = stepsToCompensate
      .filter((s) => s.contract.compensationAction)
      .map((s) => s.toolName);
    console.log(`[RECOVERY] Successful side effects: ${successfulSideEffects.join(', ')}`);
    console.log('[RECOVERY] Skipping failed ticket creation');

    // Log: UNDO_REQUESTED
    const undoReqLog: DurableLogEntry = {
      logId: `LOG-UNDO-${Date.now()}`,
      workflowId: instance.instanceId,
      workflowType: instance.workflowType,
      stepNumber: 0,
      stepId: 'STEP-UNDO-REQ',
      title: 'UNDO Requested (Saga Recovery Initiated)',
      toolName: 'recovery_coordinator',
      action: 'UNDO_REQUESTED',
      input: { workflowId: instance.instanceId },
      output: { status: 'STARTED' },
      status: 'STARTED',
      timestamp: new Date().toLocaleTimeString(),
      idempotencyKey: `UNDO_${instance.instanceId}_START`,
      compensationAction: null,
      compensationStatus: 'NONE',
      retryCount: 0,
      errorMessage: null,
      isCompensated: false,
      reversible: false,
      idempotent: true,
      requiresApproval: false,
      sideEffectDesc: 'Operator/Fault triggered backward compensation. Initializing topological rollback DAG.',
    };
    this.logEngine.appendOrUpdateEntry(undoReqLog);
    this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
    this.notify();

    let hasCompensationFailure = false;

    for (const step of reverseOrder) {
      if (!step.contract.compensationAction) {
        continue;
      }

      if (step.toolName === 'charge_payment' || step.contract.compensationAction === 'refund_payment') {
        console.log('[RECOVERY] refund_payment');
      } else if (step.toolName === 'reserve_room' || step.contract.compensationAction === 'cancel_room_booking') {
        console.log('[RECOVERY] cancel_room_booking');
      }

      await this.sleep(this.stepDelayMs);

      const shouldInjectCompFailure =
        this.state.faultInjection === 'FAIL_COMPENSATION' && step.stepNumber === 2;

      const compResult = this.world.executeCompensation(
        step.contract.compensationAction,
        step.params,
        shouldInjectCompFailure,
        instance.instanceId
      );

      this.state.worldState = compResult.newState;

      if (!compResult.success) {
        hasCompensationFailure = true;
        const log = this.state.executionLogs.find((l) => l.stepId === step.stepId);
        if (log) {
          log.status = 'COMPENSATION_FAILED';
          log.compensationStatus = 'FAILED';
          log.errorMessage = compResult.errorMessage || 'Compensation failed';
          log.compensationDesc = compResult.compensationDesc;
          this.logEngine.appendOrUpdateEntry(log);
        }
        this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
        this.state.requiresHumanEscalation = true;
        this.state.escalationReason = `CRITICAL COMPENSATION FAILURE at Step ${step.stepNumber} (${step.contract.compensationAction}): ${compResult.errorMessage}. Human escalation required to reconcile ledger.`;
        this.notify();
        break;
      } else {
        const log = this.state.executionLogs.find((l) => l.stepId === step.stepId);
        if (log) {
          log.status = 'COMPENSATED';
          log.compensationStatus = 'COMPENSATED';
          log.isCompensated = true;
          log.compensationDesc = compResult.compensationDesc;
          this.logEngine.appendOrUpdateEntry(log);
        }
        this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
        this.notify();
      }
    }

    // Final State Invariant Verification
    console.log('[RECOVERY] Verifying final state');
    const verification = this.world.verifyAgainstBaseline(instance.instanceId);
    this.state.worldDifferences = verification.differences;
    this.state.isWorldRestored = verification.isFullyRestored;
    if (verification.isFullyRestored) {
      console.log('[RECOVERY] WORLD RESTORED');
    }

    const verificationLog: DurableLogEntry = {
      logId: `LOG-VERIFY-${Date.now()}`,
      workflowId: instance.instanceId,
      workflowType: instance.workflowType,
      stepNumber: 99,
      stepId: 'STEP-FINAL-VERIFY',
      title: 'Final State Invariant Verification',
      toolName: 'state_verifier',
      action: 'FINAL_STATE_VERIFICATION',
      input: { baselineComparison: true },
      output: { isFullyRestored: verification.isFullyRestored, diffCount: verification.differences.length },
      status: 'VERIFIED',
      timestamp: new Date().toLocaleTimeString(),
      idempotencyKey: `VERIFY_${instance.instanceId}`,
      compensationAction: null,
      compensationStatus: 'NONE',
      retryCount: 0,
      errorMessage: null,
      isCompensated: false,
      reversible: false,
      idempotent: true,
      requiresApproval: false,
      sideEffectDesc: verification.isFullyRestored
        ? 'World state verified: 0 leaked side effects, baseline invariants restored.'
        : 'World state mismatch detected during verification.',
    };
    this.logEngine.appendOrUpdateEntry(verificationLog);

    if (hasCompensationFailure) {
      this.state.status = 'PARTIALLY_RECOVERED';
    } else {
      this.state.status = 'RECOVERED';

      const refundAmount =
        this.state.worldState.payment.refundedAmount > 0
          ? this.state.worldState.payment.refundedAmount
          : this.state.worldState.payment.amountCharged > 0
          ? this.state.worldState.payment.amountCharged
          : 0;

      const transactionId =
        instance.parameters.transactionId ||
        instance.parameters.paymentId ||
        instance.parameters.rideId ||
        instance.parameters.orderId ||
        instance.parameters.ticketId ||
        instance.instanceId;

      const recoveryLog: DurableLogEntry = {
        logId: `LOG-RECOVERY-${Date.now()}`,
        workflowId: instance.instanceId,
        workflowType: instance.workflowType,
        stepNumber: 100,
        stepId: 'STEP-RECOVERY-COMPLETE',
        title: 'Saga Recovery Fully Restored',
        toolName: 'saga_coordinator',
        action: 'RECOVERY',
        input: { workflowId: instance.instanceId },
        output: { status: 'FULLY_RESTORED', refundAmount },
        status: 'FULLY_RESTORED',
        timestamp: new Date().toLocaleTimeString(),
        idempotencyKey: `RECOVERY_${instance.instanceId}_COMPLETED`,
        compensationAction: null,
        compensationStatus: 'NONE',
        retryCount: 0,
        errorMessage: null,
        isCompensated: false,
        reversible: false,
        idempotent: true,
        requiresApproval: false,
        sideEffectDesc: 'Saga compensation cycle completed successfully. System returned to baseline.',
      };
      this.logEngine.appendOrUpdateEntry(recoveryLog);

      // Trigger Real Dynamic Outbound Voice & Email Notification (Instant Ringing)
      const customerPhone = instance.customer.phone || '9150390667';
      const maskedPhone = '******' + customerPhone.slice(-4);
      const immediateRecoveryCallId = `CALL-RECOVERY-${Date.now()}`;

      this.state.voiceCallNotification = {
        status: 'VOICE_RINGING',
        customerName: instance.customer.name,
        customerPhone,
        maskedPhone,
        callId: immediateRecoveryCallId,
        speechScript: `Hello ${instance.customer.name}, your transaction has been safely rolled back and refunded.`,
      };
      this.state.emailNotification = {
        status: 'EMAIL_SENDING',
        recipient: instance.customer.email,
        customerName: instance.customer.name,
      };
      this.notify();

      try {
        const compensatedNames = reverseOrder
          .filter((s) => s.contract.compensationAction)
          .map((s) => s.contract.compensationAction as string);

        const emailRes = await ApiService.triggerSagaUndo(instance.instanceId, {
          customerName: instance.customer.name,
          email: instance.customer.email,
          idempotencyKey: `UNDO_${instance.instanceId}`,
          workflowName: instance.name,
          workflowType: instance.workflowType,
          refundAmount,
          currency: instance.parameters.currency || 'INR',
          transactionId,
          compensatedSteps: compensatedNames,
          parameters: instance.parameters,
        });

        const isSentOrAccepted =
          emailRes?.email &&
          (emailRes.email.status === 'EMAIL_SENT' ||
            emailRes.email.status === 'EMAIL_ACCEPTED' ||
            emailRes.email.status === 'EMAIL_DELIVERED' ||
            emailRes.email.status === 'EMAIL_ALREADY_SENT');

        if (emailRes?.email && isSentOrAccepted) {
          const emailId = emailRes.email.email_id || emailRes.email.message_id || 'RESEND-ACCEPTED';
          const mappedStatus =
            emailRes.email.status === 'EMAIL_DELIVERED'
              ? 'EMAIL_DELIVERED'
              : emailRes.email.status === 'EMAIL_SENT'
              ? 'EMAIL_SENT'
              : emailRes.email.status === 'EMAIL_ALREADY_SENT'
              ? 'EMAIL_ALREADY_SENT'
              : 'EMAIL_ACCEPTED';

          this.state.emailNotification = {
            status: mappedStatus,
            recipient: emailRes.email.recipient,
            customerName: emailRes.email.customer_name,
            messageId: emailId,
            emailId: emailId,
            stage: emailRes.email.stage || 'EMAIL_ACCEPTED',
            stageLabel: emailRes.email.stage_label || 'C. EMAIL ACCEPTED BY RESEND',
            timestamp: emailRes.email.timestamp || new Date().toISOString(),
            rawResponse: emailRes.email.raw_response,
          };

          const emailLog: DurableLogEntry = {
            logId: `LOG-EMAIL-${Date.now()}`,
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            stepNumber: 101,
            stepId: 'STEP-EMAIL-NOTIFY',
            title: `Recovery Email ${mappedStatus === 'EMAIL_DELIVERED' ? 'Delivered' : mappedStatus === 'EMAIL_SENT' ? 'Sent via Resend API' : 'Accepted by Resend'}`,
            toolName: 'resend_email_service',
            action: 'RECOVERY_EMAIL',
            input: { recipient: instance.customer.email, customer: instance.customer.name },
            output: { status: mappedStatus, emailId, provider: 'Resend' },
            status: 'SENT',
            timestamp: new Date().toLocaleTimeString(),
            idempotencyKey: `RECOVERY_${instance.instanceId}_EMAIL_V1`,
            compensationAction: null,
            compensationStatus: 'NONE',
            retryCount: 0,
            errorMessage: null,
            isCompensated: false,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            sideEffectDesc: `Resend dispatched recovery email for ${instance.customer.name} (${instance.customer.email}). Resend Email ID: ${emailId}.`,
          };
          this.logEngine.appendOrUpdateEntry(emailLog);
        } else if (emailRes?.email && emailRes.email.status === 'EMAIL_PROVIDER_NOT_CONFIGURED') {
          const errReason = emailRes.email.error || 'RESEND_API_KEY is not configured in .env or Vercel dashboard';
          this.state.emailNotification = {
            status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
            recipient: instance.customer.email,
            customerName: instance.customer.name,
            stage: 'ENVIRONMENT_ERROR',
            stageLabel: 'A. ENVIRONMENT ERROR (MISSING RESEND_API_KEY)',
            error: errReason,
          };

          const emailLog: DurableLogEntry = {
            logId: `LOG-EMAIL-${Date.now()}`,
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            stepNumber: 101,
            stepId: 'STEP-EMAIL-NOTIFY',
            title: 'Outbound Email Provider Pending Configuration',
            toolName: 'resend_email_service',
            action: 'RECOVERY_EMAIL',
            input: { recipient: instance.customer.email, customer: instance.customer.name },
            output: { status: 'PROVIDER_NOT_CONFIGURED', error: errReason },
            status: 'PENDING',
            timestamp: new Date().toLocaleTimeString(),
            idempotencyKey: `RECOVERY_${instance.instanceId}_EMAIL_V1`,
            compensationAction: null,
            compensationStatus: 'NONE',
            retryCount: 0,
            errorMessage: errReason,
            isCompensated: false,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            sideEffectDesc: 'Saga rollback fully restored. Outbound email requires RESEND_API_KEY in .env.',
          };
          this.logEngine.appendOrUpdateEntry(emailLog);
        } else {
          const errReason = emailRes?.email?.error || 'Email delivery failed';
          this.state.emailNotification = {
            status: 'EMAIL_FAILED',
            recipient: instance.customer.email,
            customerName: instance.customer.name,
            stage: emailRes?.email?.stage || 'RESEND_API_ERROR',
            stageLabel: emailRes?.email?.stage_label || 'B. RESEND API ERROR',
            error: errReason,
            rawResponse: emailRes?.email?.raw_response,
          };

          const emailLog: DurableLogEntry = {
            logId: `LOG-EMAIL-${Date.now()}`,
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            stepNumber: 101,
            stepId: 'STEP-EMAIL-NOTIFY',
            title: 'Transactional Recovery Email Rejection Notice',
            toolName: 'resend_email_service',
            action: 'RECOVERY_EMAIL',
            input: { recipient: instance.customer.email, customer: instance.customer.name },
            output: { status: 'EMAIL_FAILED', error: errReason },
            status: 'EMAIL_FAILED',
            timestamp: new Date().toLocaleTimeString(),
            idempotencyKey: `RECOVERY_${instance.instanceId}_EMAIL_V1`,
            compensationAction: null,
            compensationStatus: 'NONE',
            retryCount: 0,
            errorMessage: errReason,
            isCompensated: false,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            sideEffectDesc: `Resend error: ${errReason}. Saga compensation and state verification succeeded.`,
          };
          this.logEngine.appendOrUpdateEntry(emailLog);
        }
      } catch (err: any) {
        this.state.emailNotification = {
          status: 'EMAIL_FAILED',
          recipient: instance.customer.email,
          customerName: instance.customer.name,
          stage: 'RESEND_API_ERROR',
          stageLabel: 'B. RESEND API NETWORK ERROR',
          error: err.message,
        };
      }

      // Trigger Real Dynamic Outbound Voice Recovery Agent (Outbound Phone Call)
      this.state.voiceCallNotification = {
        status: 'VOICE_CALLING',
        customerName: instance.customer.name,
        customerPhone,
        maskedPhone,
      };
      this.notify();

      try {
        const compensatedNames = reverseOrder
          .filter((s) => s.contract.compensationAction)
          .map((s) => s.contract.compensationAction as string);

        const voiceRes = await ApiService.triggerVoiceRecoveryCall({
          workflowId: instance.instanceId,
          transactionId,
          customerName: instance.customer.name,
          customerPhone,
          workflowType: instance.workflowType,
          failureStep: 'create_booking_ticket',
          failureReason: 'Booking ticket service failure',
          recovered: true,
          finalVerification: 'WORLD_RESTORED',
          refundedAmount: refundAmount,
          compensationActions: compensatedNames,
          emailStatus: this.state.emailNotification?.status || 'EMAIL_SENT',
        });

        if (voiceRes) {
          this.state.voiceCallNotification = {
            status: voiceRes.status,
            customerName: voiceRes.customerName,
            customerPhone: voiceRes.customerPhone,
            maskedPhone: voiceRes.maskedPhone,
            callId: voiceRes.callId,
            speechScript: voiceRes.speechScript,
            callDurationSeconds: voiceRes.callDurationSeconds,
            timestamp: voiceRes.timestamp,
            error: voiceRes.error,
            warning: voiceRes.warning,
            context: voiceRes.context,
          };

          const voiceLog: DurableLogEntry = {
            logId: `LOG-VOICE-${Date.now()}`,
            workflowId: instance.instanceId,
            workflowType: instance.workflowType,
            stepNumber: 102,
            stepId: 'STEP-VOICE-RECOVERY-CALL',
            title: `Voice Recovery Agent Call (${voiceRes.status})`,
            toolName: 'voice_recovery_service',
            action: 'VOICE_RECOVERY_CALL',
            input: { customerPhone: maskedPhone, customerName: instance.customer.name },
            output: { status: voiceRes.status, callId: voiceRes.callId, provider: 'Exotel' },
            status: voiceRes.success ? 'SENT' : 'FAILED',
            timestamp: new Date().toLocaleTimeString(),
            idempotencyKey: `RECOVERY_${instance.instanceId}_VOICE_CALL`,
            compensationAction: null,
            compensationStatus: 'NONE',
            retryCount: 0,
            errorMessage: voiceRes.error || null,
            isCompensated: false,
            reversible: false,
            idempotent: true,
            requiresApproval: false,
            sideEffectDesc: `Voice Recovery Agent initiated call to ${maskedPhone}. Status: ${voiceRes.status}.`,
          };
          this.logEngine.appendOrUpdateEntry(voiceLog);
        }
      } catch (err: any) {
        console.error('[VOICE] Voice recovery call error:', err);
      }
    }

    this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
    this.notify();
  }

  // --- Manual / Retry Voice Recovery Call ---
  public async triggerVoiceCall(forceRetry: boolean = false): Promise<void> {
    const instance = this.state.instance;
    const customerPhone = instance.customer.phone || '9150390667';
    const maskedPhone = '******' + customerPhone.slice(-4);

    this.state.voiceCallNotification = {
      status: 'VOICE_CALLING',
      customerName: instance.customer.name,
      customerPhone,
      maskedPhone,
    };
    this.notify();

    const refundAmount =
      instance.parameters.fare ||
      instance.parameters.roomPrice ||
      instance.parameters.price ||
      instance.parameters.creditAmount ||
      750;

    const transactionId =
      instance.parameters.transactionId ||
      instance.parameters.paymentId ||
      instance.parameters.rideId ||
      instance.parameters.orderId ||
      instance.parameters.ticketId ||
      instance.instanceId;

    try {
      const voiceRes = await ApiService.triggerVoiceRecoveryCall({
        workflowId: instance.instanceId,
        transactionId: forceRetry ? `${transactionId}-RETRY-${Date.now()}` : transactionId,
        customerName: instance.customer.name,
        customerPhone,
        workflowType: instance.workflowType,
        failureStep: 'create_booking_ticket',
        failureReason: 'Booking ticket service failure',
        recovered: this.state.isWorldRestored && this.state.status === 'RECOVERED',
        finalVerification: this.state.isWorldRestored ? 'WORLD_RESTORED' : 'PENDING_RESTORE',
        refundedAmount: refundAmount,
        compensationActions: ['refund_payment()', 'cancel_room_booking()', 'restore_inventory()'],
        emailStatus: this.state.emailNotification?.status || 'EMAIL_SENT',
      });

      if (voiceRes) {
        this.state.voiceCallNotification = {
          status: voiceRes.status,
          customerName: voiceRes.customerName,
          customerPhone: voiceRes.customerPhone,
          maskedPhone: voiceRes.maskedPhone,
          callId: voiceRes.callId,
          speechScript: voiceRes.speechScript,
          callDurationSeconds: voiceRes.callDurationSeconds,
          timestamp: voiceRes.timestamp,
          error: voiceRes.error,
          warning: voiceRes.warning,
          context: voiceRes.context,
        };

        const voiceLog: DurableLogEntry = {
          logId: `LOG-VOICE-RETRY-${Date.now()}`,
          workflowId: instance.instanceId,
          workflowType: instance.workflowType,
          stepNumber: 102,
          stepId: 'STEP-VOICE-RECOVERY-CALL',
          title: `Voice Recovery Agent Call (${voiceRes.status})`,
          toolName: 'voice_recovery_service',
          action: 'VOICE_RECOVERY_CALL',
          input: { customerPhone: maskedPhone, customerName: instance.customer.name },
          output: { status: voiceRes.status, callId: voiceRes.callId, provider: 'Exotel' },
          status: voiceRes.success ? 'SENT' : 'FAILED',
          timestamp: new Date().toLocaleTimeString(),
          idempotencyKey: `RECOVERY_${instance.instanceId}_VOICE_RETRY_${Date.now()}`,
          compensationAction: null,
          compensationStatus: 'NONE',
          retryCount: 1,
          errorMessage: voiceRes.error || null,
          isCompensated: false,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          sideEffectDesc: `Voice Recovery Agent dispatched call to ${maskedPhone}. Status: ${voiceRes.status}.`,
        };
        this.logEngine.appendOrUpdateEntry(voiceLog);
      }
    } catch (err: any) {
      console.error('[VOICE] Voice recovery retry error:', err);
    }

    this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
    this.notify();
  }

  // --- Retry Email Notification ONLY ---
  public async retryEmailNotification(forceRetry: boolean = false): Promise<void> {
    const instance = this.state.instance;
    if (!this.state.emailNotification) {
      this.state.emailNotification = {
        status: 'EMAIL_SENDING',
        recipient: instance.customer.email,
        customerName: instance.customer.name,
      };
    } else {
      this.state.emailNotification.status = 'EMAIL_SENDING';
      this.state.emailNotification.error = undefined;
    }
    this.notify();

    const refundAmount =
      instance.parameters.fare ||
      instance.parameters.roomPrice ||
      instance.parameters.price ||
      instance.parameters.creditAmount ||
      0;

    const transactionId =
      instance.parameters.transactionId ||
      instance.parameters.paymentId ||
      instance.parameters.rideId ||
      instance.parameters.orderId ||
      instance.parameters.ticketId ||
      instance.instanceId;

    try {
      const emailRes = await ApiService.retryEmailNotification(instance.instanceId, {
        customerName: instance.customer.name,
        email: instance.customer.email,
        workflowName: instance.name,
        workflowType: instance.workflowType,
        refundAmount,
        currency: instance.parameters.currency || (instance.workflowType === 'hotel_booking' ? 'USD' : 'INR'),
        transactionId,
        parameters: instance.parameters,
        forceRetry,
      });

      const isSentOrAccepted =
        emailRes?.email &&
        (emailRes.email.status === 'EMAIL_SENT' ||
          emailRes.email.status === 'EMAIL_ACCEPTED' ||
          emailRes.email.status === 'EMAIL_DELIVERED' ||
          emailRes.email.status === 'EMAIL_ALREADY_SENT');

      if (emailRes?.email && isSentOrAccepted) {
        const emailId = emailRes.email.email_id || emailRes.email.message_id || 'RESEND-ACCEPTED';
        const mappedStatus =
          emailRes.email.status === 'EMAIL_DELIVERED'
            ? 'EMAIL_DELIVERED'
            : emailRes.email.status === 'EMAIL_SENT'
            ? 'EMAIL_SENT'
            : emailRes.email.status === 'EMAIL_ALREADY_SENT'
            ? 'EMAIL_ALREADY_SENT'
            : 'EMAIL_ACCEPTED';

        this.state.emailNotification = {
          status: mappedStatus,
          recipient: emailRes.email.recipient,
          customerName: emailRes.email.customer_name,
          messageId: emailId,
          emailId: emailId,
          stage: emailRes.email.stage || 'EMAIL_ACCEPTED',
          stageLabel: emailRes.email.stage_label || 'C. EMAIL ACCEPTED BY RESEND',
          timestamp: emailRes.email.timestamp || new Date().toISOString(),
          rawResponse: emailRes.email.raw_response,
        };

        const emailLog: DurableLogEntry = {
          logId: `LOG-EMAIL-RETRY-${Date.now()}`,
          workflowId: instance.instanceId,
          workflowType: instance.workflowType,
          stepNumber: 101,
          stepId: 'STEP-EMAIL-NOTIFY',
          title: `Transactional Recovery Email Dispatched (Retry)`,
          toolName: 'resend_email_service',
          action: 'RECOVERY_EMAIL',
          input: { recipient: instance.customer.email, customer: instance.customer.name },
          output: { status: mappedStatus, emailId, provider: 'Resend' },
          status: 'SENT',
          timestamp: new Date().toLocaleTimeString(),
          idempotencyKey: `RECOVERY_${instance.instanceId}_EMAIL_RETRY_${Date.now()}`,
          compensationAction: null,
          compensationStatus: 'NONE',
          retryCount: 1,
          errorMessage: null,
          isCompensated: false,
          reversible: false,
          idempotent: true,
          requiresApproval: false,
          sideEffectDesc: `Successfully submitted recovery notification to Resend upon retry. Resend Email ID: ${emailId}.`,
        };
        this.logEngine.appendOrUpdateEntry(emailLog);
      } else if (emailRes?.email && emailRes.email.status === 'EMAIL_PROVIDER_NOT_CONFIGURED') {
        const errReason = emailRes.email.error || 'RESEND_API_KEY is not configured in .env or Vercel dashboard';
        this.state.emailNotification = {
          status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
          recipient: instance.customer.email,
          customerName: instance.customer.name,
          stage: 'ENVIRONMENT_ERROR',
          stageLabel: 'A. ENVIRONMENT ERROR',
          error: errReason,
        };
      } else {
        const errReason = emailRes?.email?.error || 'Email retry failed';
        this.state.emailNotification = {
          status: 'EMAIL_FAILED',
          recipient: instance.customer.email,
          customerName: instance.customer.name,
          stage: emailRes?.email?.stage || 'RESEND_API_ERROR',
          stageLabel: emailRes?.email?.stage_label || 'B. RESEND API ERROR',
          error: errReason,
          rawResponse: emailRes?.email?.raw_response,
        };
      }
    } catch (err: any) {
      this.state.emailNotification = {
        status: 'EMAIL_FAILED',
        recipient: instance.customer.email,
        customerName: instance.customer.name,
        error: err.message,
      };
    }
    this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
    this.notify();
  }

  // --- Resume Workflow After Crash ---
  public async resumeAfterCrash(): Promise<WorkflowRuntimeState> {
    if (!this.state.isSimulatedCrash && this.state.status !== 'CRASHED') {
      return this.getState();
    }

    const instance = this.state.instance;
    const logs = this.logEngine.getWorkflowLogs(instance.instanceId);
    const completedStepNumbers = logs
      .filter((l) => l.status === 'COMPLETED')
      .map((l) => l.stepNumber);

    const maxCompleted = completedStepNumbers.length > 0 ? Math.max(...completedStepNumbers) : 0;

    this.state.status = 'RUNNING';
    this.state.isSimulatedCrash = false;
    this.state.canResumeAfterCrash = false;
    this.state.lastError = null;
    this.state.faultInjection = 'NONE';
    this.notify();

    const allCompletedSpecs: WorkflowStepSpec[] = instance.steps.filter((s) =>
      completedStepNumbers.includes(s.stepNumber)
    );

    for (let i = maxCompleted; i < instance.steps.length; i++) {
      const step = instance.steps[i];
      this.state.currentStepIndex = i;
      this.state.activeStep = step;
      this.notify();

      if (step.contract.requiresApproval) {
        this.state.status = 'AWAITING_APPROVAL';
        this.state.awaitingApprovalStep = step;
        this.notify();

        const approved = await this.waitForApprovalOrAutoResolve();
        if (!approved) {
          this.state.status = 'FAILED';
          this.state.lastError = `Step '${step.title}' was rejected during approval review. Rolling back.`;
          this.notify();
          await this.executeReverseCompensation(allCompletedSpecs);
          return this.getState();
        }
        this.state.status = 'RUNNING';
        this.state.awaitingApprovalStep = null;
        this.notify();
      }

      await this.sleep(this.stepDelayMs);

      const idempotencyKey = `${instance.instanceId}_step_${step.stepNumber}_${step.toolName}`;
      const idempotencyCheck = this.logEngine.checkIdempotency(idempotencyKey);

      if (idempotencyCheck.isDuplicate && idempotencyCheck.previousEntry) {
        this.state.duplicatePreventedCount += 1;
        allCompletedSpecs.push(step);
        this.notify();
        continue;
      }

      const execResult = this.world.executeAction(step.toolName, step.params, instance.instanceId);
      this.state.worldState = execResult.newState;

      const logEntry: DurableLogEntry = {
        logId: `LOG-${Date.now()}-${step.stepNumber}`,
        workflowId: instance.instanceId,
        workflowType: instance.workflowType,
        stepNumber: step.stepNumber,
        stepId: step.stepId,
        title: step.title,
        toolName: step.toolName,
        action: step.contract.action,
        input: step.params,
        output: execResult.output,
        status: 'COMPLETED',
        timestamp: new Date().toLocaleTimeString(),
        idempotencyKey,
        compensationAction: step.contract.compensationAction,
        compensationStatus: 'PENDING',
        retryCount: 0,
        errorMessage: null,
        isCompensated: false,
        reversible: step.contract.reversible,
        idempotent: step.contract.idempotent,
        requiresApproval: step.contract.requiresApproval,
        sideEffectDesc: execResult.sideEffectDesc,
      };

      this.logEngine.appendOrUpdateEntry(logEntry);
      allCompletedSpecs.push(step);
      this.state.executionLogs = this.logEngine.getWorkflowLogs(instance.instanceId);
      this.notify();
    }

    this.state.status = 'COMPLETED';
    this.state.activeStep = null;
    const verification = this.world.verifyAgainstBaseline(instance.instanceId);
    this.state.worldDifferences = verification.differences;
    this.notify();

    return this.getState();
  }

  // --- Rollback After Crash ---
  public async rollbackAfterCrash(): Promise<void> {
    const instance = this.state.instance;
    const logs = this.logEngine.getWorkflowLogs(instance.instanceId);
    const completedStepNumbers = logs
      .filter((l) => l.status === 'COMPLETED')
      .map((l) => l.stepNumber);

    const completedSpecs = instance.steps.filter((s) =>
      completedStepNumbers.includes(s.stepNumber)
    );

    this.state.isSimulatedCrash = false;
    this.state.canResumeAfterCrash = false;
    await this.executeReverseCompensation(completedSpecs);
  }

  // --- Trigger Manual Rollback of Current Workflow ---
  public async rollbackCurrentWorkflow(): Promise<void> {
    const instance = this.state.instance;
    const logs = this.logEngine.getWorkflowLogs(instance.instanceId);
    const completedStepNumbers = logs
      .filter((l) => l.status === 'COMPLETED' || l.status === 'PENDING')
      .map((l) => l.stepNumber);

    const completedSpecs = instance.steps.filter((s) =>
      completedStepNumbers.includes(s.stepNumber)
    );

    await this.executeReverseCompensation(completedSpecs);
  }

  private approvalResolver: ((approved: boolean) => void) | null = null;

  public respondToApproval(approved: boolean): void {
    if (this.approvalResolver) {
      this.approvalResolver(approved);
      this.approvalResolver = null;
    }
  }

  private waitForApprovalOrAutoResolve(): Promise<boolean> {
    return new Promise((resolve) => {
      this.approvalResolver = resolve;
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const sagaEngineInstance = new SagaExecutionEngine();
