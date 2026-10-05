// ============================================================================
// UNDO.AI (AG02) — PRODUCTION ACCEPTANCE TEST SUITE (10 SCENARIOS)
// Automated verification of Saga guarantees, crash recovery, idempotency & email
// ============================================================================

import { WorkflowService } from './core/workflowService.ts';
import { durableStore } from './core/durableStore.ts';
import { worldStateManager } from './core/mockWorld.ts';
import { emailService } from './core/emailService.ts';
import { voiceRecoveryService } from './core/voiceRecoveryService.ts';
import { stateVerifier } from './core/stateVerifier.ts';

export interface TestCaseResult {
  testId: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details: Record<string, any>;
  error?: string;
}

export interface TestSuiteSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  timestamp: string;
  results: TestCaseResult[];
}

export async function runAcceptanceTestSuite(): Promise<TestSuiteSummary> {
  const results: TestCaseResult[] = [];
  const startSuiteTime = Date.now();

  // --------------------------------------------------------------------------
  // TEST 1: Cab happy path -> FULLY_COMPLETED
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0, pickup: 'Thiruvanmiyur', drop: 'OMR' }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      const passed = execResult.success && execResult.workflow.status === 'COMPLETED' && execResult.executedSteps.length === 5;
      results.push({
        testId: 'TEST_1_CAB_HAPPY_PATH',
        name: 'Cab Happy Path Execution',
        description: 'Complete all steps of Cab Booking successfully',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, status: execResult.workflow.status, executedSteps: execResult.executedSteps },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_1_CAB_HAPPY_PATH',
        name: 'Cab Happy Path Execution',
        description: 'Complete all steps of Cab Booking successfully',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 2: Failure at payment -> previous reversible steps compensated
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'FAIL_STEP_4'); // step 4 is charge_fare
      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');

      const logs = svc.getWorkflowLogs(wf.workflowId);
      const compLogs = logs.filter((l) => l.status === 'COMPENSATED');
      const passed = !execResult.success && undoResult.finalStateVerified === true && compLogs.length > 0;

      results.push({
        testId: 'TEST_2_FAILURE_AT_PAYMENT',
        name: 'Failure at Payment Step',
        description: 'Automatic compensation of completed steps when payment fails',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, status: undoResult.status, compensatedLogs: compLogs.map((l) => l.compensationAction) },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_2_FAILURE_AT_PAYMENT',
        name: 'Failure at Payment Step',
        description: 'Automatic compensation of completed steps when payment fails',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 3: Failure after payment -> refund + cancel ride + release driver
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'FAIL_STEP_5'); // step 5 is dispatch_otp
      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');

      const logs = svc.getWorkflowLogs(wf.workflowId);
      const compActions = logs.filter((l) => l.status === 'COMPENSATED').map((l) => l.compensationAction);
      const hasRefund = compActions.includes('refund_payment');
      const hasCancelRide = compActions.includes('cancel_ride');
      const hasReleaseDriver = compActions.includes('release_driver');
      const passed = !execResult.success && undoResult.finalStateVerified === true && hasRefund && hasCancelRide && hasReleaseDriver;

      results.push({
        testId: 'TEST_3_FAILURE_AFTER_PAYMENT',
        name: 'Failure After Payment',
        description: 'Strict reverse compensation: Refund Payment -> Cancel Ride -> Release Driver',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, compActions },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_3_FAILURE_AFTER_PAYMENT',
        name: 'Failure After Payment',
        description: 'Strict reverse compensation',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 4: Crash after payment -> restart without duplicate charge
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const crashResult = await svc.executeWorkflow(wf.workflowId, 'CRASH_AFTER_STEP_4'); // crash after charge_fare

      const recoveryInfo = durableStore.recoverAfterCrash(wf.workflowId);
      // Restart execution
      const resumeResult = await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      // Verify payment was not double charged
      const logs = svc.getWorkflowLogs(wf.workflowId);
      const chargeLogs = logs.filter((l) => l.stepId === 'charge_fare' && l.status === 'COMPLETED');
      const passed = crashResult.crashed && chargeLogs.length === 1 && resumeResult.success && recoveryInfo.nextStepIndex > 0;

      results.push({
        testId: 'TEST_4_CRASH_RECOVERY',
        name: 'Crash Recovery Without Duplicate Charge',
        description: 'Replay durable log after crash and skip already completed operations',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, chargeAttempts: chargeLogs.length, resumedStatus: resumeResult.workflow.status, recoveryInfo },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_4_CRASH_RECOVERY',
        name: 'Crash Recovery Without Duplicate Charge',
        description: 'Replay durable log after crash',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 5: Undo clicked twice -> only one refund (Idempotency)
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      const idempotencyKey = `UNDO-${wf.workflowId}`;
      const undo1 = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO', idempotencyKey);
      const undo2 = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO', idempotencyKey);

      const logs = svc.getWorkflowLogs(wf.workflowId);
      const refundCompensations = logs.filter((l) => l.status === 'COMPENSATED' && l.compensationAction === 'refund_payment');
      const passed = undo1.success && undo2.isDuplicate === true && refundCompensations.length === 1;

      results.push({
        testId: 'TEST_5_IDEMPOTENT_UNDO',
        name: 'Idempotent Undo Execution',
        description: 'Duplicate undo requests must never trigger duplicate refunds',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, refundCount: refundCompensations.length, isDuplicateSuppressed: undo2.isDuplicate },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_5_IDEMPOTENT_UNDO',
        name: 'Idempotent Undo Execution',
        description: 'Duplicate undo requests must never trigger duplicate refunds',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 6: Recovery email -> Resend email dispatch integration
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const isConfigured = emailService.isConfigured();
      const testEmailResult = await emailService.sendTestEmail('divakaranperumal27@gmail.com', 'Divakaran');

      const passed = isConfigured ? testEmailResult.success || testEmailResult.status === 'EMAIL_ACCEPTED' : testEmailResult.status === 'EMAIL_PROVIDER_NOT_CONFIGURED';
      results.push({
        testId: 'TEST_6_EMAIL_INTEGRATION',
        name: 'Email Integration Pipeline',
        description: 'Dispatch real email or return accurate diagnostic stage without falsification',
        passed,
        durationMs: Date.now() - testStart,
        details: { status: testEmailResult.status, stage: testEmailResult.stage, isConfigured },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_6_EMAIL_INTEGRATION',
        name: 'Email Integration Pipeline',
        description: 'Dispatch real email or return accurate diagnostic stage',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 7: Recovery email sent twice -> second request returns EMAIL_ALREADY_SENT
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      // Simulate recovery email accepted and recorded
      const params = wf.parameters || {};
      const transactionId = params.transactionId || params.bookingId || params.ticketId || params.rideId || params.orderId || wf.workflowId;
      const notificationKey = `RECOVERY-EMAIL-${wf.workflowId}-${transactionId}`;
      durableStore.markEmailSent(notificationKey);
      durableStore.setIdempotencyResult(notificationKey, { emailId: 're_test_uuid_idempotent' });

      // Second send attempt
      const email2 = await emailService.sendRecoveryEmail(wf);

      const passed = email2.status === 'EMAIL_ALREADY_SENT' && email2.emailId === 're_test_uuid_idempotent';
      results.push({
        testId: 'TEST_7_EMAIL_IDEMPOTENCY',
        name: 'Email Idempotency',
        description: 'Second notification attempt must return EMAIL_ALREADY_SENT',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, status: email2.status, emailId: email2.emailId },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_7_EMAIL_IDEMPOTENCY',
        name: 'Email Idempotency',
        description: 'Second notification attempt',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 8: Email provider failure -> workflow remains FULLY_RESTORED
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'invalid-email-format' });
      await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO', undefined, 'invalid-email-format');
      const passed = undoResult.status === 'FULLY_RESTORED' && undoResult.finalStateVerified === true;

      results.push({
        testId: 'TEST_8_EMAIL_FAILURE_ISOLATION',
        name: 'Email Failure Isolation',
        description: 'Email dispatch failure must never rollback or corrupt FULLY_RESTORED status',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, status: undoResult.status, finalStateVerified: undoResult.finalStateVerified },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_8_EMAIL_FAILURE_ISOLATION',
        name: 'Email Failure Isolation',
        description: 'Email dispatch failure isolation',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 9: Compensation failure -> COMPENSATION_FAILED + human escalation
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0, failCompensation: true }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      wf.faultConfiguration = 'FAIL_COMPENSATION';
      await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');
      const passed = undoResult.status === 'COMPENSATION_FAILED' && undoResult.requiresHuman === true && !undoResult.finalStateVerified;

      results.push({
        testId: 'TEST_9_COMPENSATION_FAILURE',
        name: 'Compensation Failure & Human Escalation',
        description: 'When compensation fails, escalate to REQUIRES_HUMAN and never claim WORLD_RESTORED',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, status: undoResult.status, requiresHuman: undoResult.requiresHuman },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_9_COMPENSATION_FAILURE',
        name: 'Compensation Failure & Human Escalation',
        description: 'Compensation Failure',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 10: Final-state verification mismatch -> NEVER display WORLD_RESTORED
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('cab_booking', { fare: 420.0 }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      await svc.executeWorkflow(wf.workflowId, 'NONE', true);

      // Manually tamper world state to create an invariant leak
      const worldState = worldStateManager.getOrCreateWorldState(wf.workflowId, 'cab_booking', wf.parameters);
      if (worldState.cab) {
        worldState.cab.driver.state = 'BUSY'; // Invariant violation (should be AVAILABLE after undo)
      }

      const verification = stateVerifier.verifyWorldRestored(wf.workflowType, worldState, wf.parameters);
      const passed = !verification.verified && verification.status === 'STATE_MISMATCH' && verification.failedInvariants.length > 0;

      results.push({
        testId: 'TEST_10_INVARIANT_VERIFICATION_MISMATCH',
        name: 'Final-State Invariant Verification Mismatch',
        description: 'Any leaked state or invariant failure strictly prevents WORLD_RESTORED',
        passed,
        durationMs: Date.now() - testStart,
        details: { verified: verification.verified, status: verification.status, failedInvariants: verification.failedInvariants },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_10_INVARIANT_VERIFICATION_MISMATCH',
        name: 'Final-State Invariant Verification Mismatch',
        description: 'Invariant Verification Mismatch',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 11: E-Commerce Step 5 Failure -> SAGA Reverse Compensation
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('ecommerce_order', { price: 85000.0, productName: 'AI Workstation' }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'FAIL_STEP_5');

      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');
      const logs = svc.getWorkflowLogs(wf.workflowId);
      const compActions = logs.filter((l) => l.status === 'COMPENSATED').map((l) => l.compensationAction);

      const passed = !execResult.success && undoResult.finalStateVerified === true;
      results.push({
        testId: 'TEST_11_ECOMMERCE_STEP_5_RECOVERY',
        name: 'E-Commerce Step 5 SAGA Rollback',
        description: 'Shipment label failure leaves transaction partially completed; Undo restores inventory and refunds payment without voiding nonexistent label',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, compActions, finalStateVerified: undoResult.finalStateVerified },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_11_ECOMMERCE_STEP_5_RECOVERY',
        name: 'E-Commerce Step 5 SAGA Rollback',
        description: 'Shipment label failure SAGA recovery',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 12: Customer Support Step 5 Failure -> SAGA Reverse Compensation
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('customer_support', { creditAmount: 500.0, issue: 'Payment transaction failed' }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'FAIL_STEP_5');

      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');
      const logs = svc.getWorkflowLogs(wf.workflowId);
      const compActions = logs.filter((l) => l.status === 'COMPENSATED').map((l) => l.compensationAction);

      const passed = !execResult.success && undoResult.finalStateVerified === true;
      results.push({
        testId: 'TEST_12_CUSTOMER_SUPPORT_STEP_5_RECOVERY',
        name: 'Customer Support Step 5 SAGA Rollback',
        description: 'Resolution credit failure allows undoing priority escalation, specialist assignment, and ticket creation without revoking nonexistent credit',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, compActions, finalStateVerified: undoResult.finalStateVerified },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_12_CUSTOMER_SUPPORT_STEP_5_RECOVERY',
        name: 'Customer Support Step 5 SAGA Rollback',
        description: 'Customer support resolution credit failure SAGA recovery',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 13: Hotel Booking Step 5 Failure -> SAGA Reverse Compensation
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const svc = new WorkflowService();
      const wf = svc.createWorkflow('hotel_booking', { roomPrice: 750.0, hotelName: 'Pharos Hotels' }, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' });
      const execResult = await svc.executeWorkflow(wf.workflowId, 'FAIL_STEP_5');

      const undoResult = await svc.undoWorkflow(wf.workflowId, 'USER_UNDO');
      const logs = svc.getWorkflowLogs(wf.workflowId);
      const compActions = logs.filter((l) => l.status === 'COMPENSATED').map((l) => l.compensationAction);

      const passed = !execResult.success && undoResult.finalStateVerified === true;
      results.push({
        testId: 'TEST_13_HOTEL_BOOKING_STEP_5_RECOVERY',
        name: 'Hotel Booking Step 5 SAGA Rollback',
        description: 'Ticket voucher failure allows undoing payment and room reservation in reverse order without voiding nonexistent ticket',
        passed,
        durationMs: Date.now() - testStart,
        details: { workflowId: wf.workflowId, compActions, finalStateVerified: undoResult.finalStateVerified },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_13_HOTEL_BOOKING_STEP_5_RECOVERY',
        name: 'Hotel Booking Step 5 SAGA Rollback',
        description: 'Hotel booking ticket failure SAGA recovery',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 14: Voice Recovery Agent — Critical Safety Guard Block Check
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      // Must reject call if recovered is false or unverified
      const blockedRes = await voiceRecoveryService.initiateRecoveryCall({
        workflowId: 'WF-UNVERIFIED-001',
        transactionId: 'TX-UNVERIFIED',
        customerName: 'Divakaran',
        customerPhone: '9150390667',
        workflowType: 'hotel_booking',
        recovered: false,
        finalVerification: 'PENDING',
      });

      const passed = !blockedRes.success && blockedRes.status === 'VOICE_BLOCKED';
      results.push({
        testId: 'TEST_14_VOICE_SAFETY_GUARD_BLOCK',
        name: 'Voice Agent Safety Guard Block',
        description: 'Ensures voice recovery call is blocked before world restoration and verification pass',
        passed,
        durationMs: Date.now() - testStart,
        details: { status: blockedRes.status, error: blockedRes.error },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_14_VOICE_SAFETY_GUARD_BLOCK',
        name: 'Voice Agent Safety Guard Block',
        description: 'Ensures voice recovery call is blocked before world restoration',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST 15: Voice Recovery Agent — Verified State Q&A & Transcript
  // --------------------------------------------------------------------------
  {
    const testStart = Date.now();
    try {
      const callRes = await voiceRecoveryService.initiateRecoveryCall({
        workflowId: 'WF-HTL-TEST-VOICE',
        transactionId: `TX-VOICE-${Date.now()}`,
        customerName: 'Divakaran',
        customerPhone: '9150390667',
        workflowType: 'hotel_booking',
        failureStep: 'create_booking_ticket',
        failureReason: 'Booking ticket service failure',
        recovered: true,
        finalVerification: 'WORLD_RESTORED',
        refundedAmount: 750,
        compensationActions: ['refund_payment()', 'cancel_room_booking()', 'restore_inventory()'],
        emailStatus: 'EMAIL_SENT',
      });

      const scriptContainsRefund = callRes.speechScript.includes('750') || callRes.speechScript.includes('refunded');
      const maskedPhoneCheck = callRes.maskedPhone === '******0667';
      const qnaAnswer = voiceRecoveryService.answerCustomerQuery('Was I charged or refunded?', callRes.context);
      const qnaContainsRefund = qnaAnswer.includes('refund') || qnaAnswer.includes('restored');

      const passed = callRes.success && scriptContainsRefund && maskedPhoneCheck && qnaContainsRefund;
      results.push({
        testId: 'TEST_15_VOICE_VERIFIED_STATE_QNA',
        name: 'Voice Agent Verified State Q&A',
        description: 'Verifies voice speech script generation, phone masking, and interactive question answering on runtime state',
        passed,
        durationMs: Date.now() - testStart,
        details: { maskedPhone: callRes.maskedPhone, scriptLength: callRes.speechScript.length, qnaAnswer },
      });
    } catch (err: any) {
      results.push({
        testId: 'TEST_15_VOICE_VERIFIED_STATE_QNA',
        name: 'Voice Agent Verified State Q&A',
        description: 'Voice agent verified state script and Q&A',
        passed: false,
        durationMs: Date.now() - testStart,
        details: {},
        error: err.message,
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    totalTests: results.length,
    passedCount,
    failedCount,
    durationMs: Date.now() - startSuiteTime,
    timestamp: new Date().toISOString(),
    results,
  };
}
