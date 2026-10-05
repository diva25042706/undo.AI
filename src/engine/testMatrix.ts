// ============================================================================
// UNDO.AI — DYNAMIC SAGA TEST MATRIX & VERIFICATION RUNNER
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

import { WORKFLOW_DEFINITIONS, WorkflowType, generateWorkflowInstance } from './workflows';
import { MockWorldEngine } from './mockWorld';
import { DurableExecutionLogEngine } from './durableLog';
import { SagaExecutionEngine, FaultInjectionOption } from './sagaEngine';

export interface TestCaseResult {
  testId: string;
  workflowType: WorkflowType;
  workflowName: string;
  scenarioName: string;
  faultType: FaultInjectionOption;
  status: 'PASS' | 'FAIL' | 'RUNNING' | 'PENDING';
  expectedOutcome: string;
  actualOutcome: string;
  isWorldRestored: boolean;
  compensationCount: number;
  durationMs: number;
  details: string;
}

export class TestMatrixRunner {
  private static testScenarios: Array<{
    scenarioName: string;
    faultType: FaultInjectionOption;
    expectedOutcome: string;
    isCrashTest?: boolean;
    isCompensationFailTest?: boolean;
  }> = [
    {
      scenarioName: 'Happy Path (No Fault)',
      faultType: 'NONE',
      expectedOutcome: 'All 5 steps complete with 0 compensations needed. World in target completed state.',
    },
    {
      scenarioName: 'Injected Failure at Step 1',
      faultType: 'FAIL_STEP_1',
      expectedOutcome: 'Step 1 fails. 0 side effects committed. World remains 100% in baseline state.',
    },
    {
      scenarioName: 'Injected Failure at Step 2',
      faultType: 'FAIL_STEP_2',
      expectedOutcome: 'Step 2 fails. Reverse compensation undoes Step 1 -> World Restored.',
    },
    {
      scenarioName: 'Injected Failure at Step 3',
      faultType: 'FAIL_STEP_3',
      expectedOutcome: 'Step 3 fails. Reverse compensation undoes Step 2 -> Step 1 -> World Restored.',
    },
    {
      scenarioName: 'Injected Failure at Step 4',
      faultType: 'FAIL_STEP_4',
      expectedOutcome: 'Step 4 fails. Reverse compensation undoes Step 3 -> Step 2 -> Step 1 -> World Restored.',
    },
    {
      scenarioName: 'Injected Failure at Step 5',
      faultType: 'FAIL_STEP_5',
      expectedOutcome: 'Step 5 fails. Reverse compensation undoes Steps 4, 3, 2, 1 -> World Restored.',
    },
    {
      scenarioName: 'Injected Failure at Step 6',
      faultType: 'FAIL_STEP_6',
      expectedOutcome: 'Step 6 fails. Reverse compensation undoes Steps 5, 4, 3, 2, 1 -> World Restored.',
    },
    {
      scenarioName: 'Simulated Crash After Step 1',
      faultType: 'CRASH_AFTER_STEP_1',
      expectedOutcome: 'Crash detected. Resume reads durable log, prevents duplicate Step 1 side effect, finishes remaining steps.',
      isCrashTest: true,
    },
    {
      scenarioName: 'Simulated Crash After Step 2',
      faultType: 'CRASH_AFTER_STEP_2',
      expectedOutcome: 'Crash detected. Resume reads durable log, prevents duplicate Steps 1 & 2, finishes remaining steps.',
      isCrashTest: true,
    },
    {
      scenarioName: 'Simulated Crash After Step 3',
      faultType: 'CRASH_AFTER_STEP_3',
      expectedOutcome: 'Crash detected. Resume reads durable log, prevents duplicate Steps 1, 2, 3, finishes remaining steps.',
      isCrashTest: true,
    },
    {
      scenarioName: 'Injected Compensation Failure',
      faultType: 'FAIL_COMPENSATION',
      expectedOutcome: 'Compensation fails at Step 2. System flags PARTIALLY_RECOVERED and triggers Human Escalation.',
      isCompensationFailTest: true,
    },
  ];

  public static async runSingleTest(
    workflowType: WorkflowType,
    scenarioIndex: number
  ): Promise<TestCaseResult> {
    const scenario = this.testScenarios[scenarioIndex];
    const def = WORKFLOW_DEFINITIONS[workflowType];
    const startTime = performance.now();

    const isolatedWorld = new MockWorldEngine();
    const isolatedLog = new DurableExecutionLogEngine();
    const isolatedEngine = new SagaExecutionEngine(isolatedWorld, isolatedLog);
    isolatedEngine.setStepDelay(10); // Run fast for test matrix

    // Auto-approve irreversible steps during automated test suite
    isolatedEngine.subscribe((st) => {
      if (st.status === 'AWAITING_APPROVAL') {
        isolatedEngine.respondToApproval(true);
      }
    });

    let runState = await isolatedEngine.runWorkflow(workflowType, scenario.faultType);

    if (scenario.isCrashTest && runState.status === 'CRASHED') {
      runState = await isolatedEngine.resumeAfterCrash();
    }

    const durationMs = Math.round(performance.now() - startTime);
    let passed = false;
    let actualOutcome = '';

    if (scenario.faultType === 'NONE') {
      passed = runState.status === 'COMPLETED';
      actualOutcome = `Workflow completed with status ${runState.status}.`;
    } else if (scenario.isCrashTest) {
      passed = runState.status === 'COMPLETED' && runState.duplicatePreventedCount >= 1;
      actualOutcome = `Recovered after crash. Prevented ${runState.duplicatePreventedCount} duplicate side effects.`;
    } else if (scenario.isCompensationFailTest) {
      passed = runState.status === 'PARTIALLY_RECOVERED' && runState.requiresHumanEscalation;
      actualOutcome = `Compensation failure properly detected. Human escalation triggered: ${runState.escalationReason?.slice(0, 50)}...`;
    } else {
      passed = (runState.status === 'RECOVERED' || runState.status === 'FAILED') && runState.isWorldRestored;
      actualOutcome = `Compensated ${runState.compensationSequence.length} steps in reverse order. World status: ${runState.isWorldRestored ? 'RESTORED' : 'MISMATCH'}.`;
    }

    return {
      testId: `TEST-${workflowType.toUpperCase().slice(0, 4)}-${scenarioIndex + 1}`,
      workflowType,
      workflowName: def.name.split('(')[0].trim(),
      scenarioName: scenario.scenarioName,
      faultType: scenario.faultType,
      status: passed ? 'PASS' : 'FAIL',
      expectedOutcome: scenario.expectedOutcome,
      actualOutcome,
      isWorldRestored: runState.isWorldRestored,
      compensationCount: runState.compensationSequence.length,
      durationMs,
      details: runState.lastError || runState.status,
    };
  }

  public static async runAllTests(
    onProgress?: (current: number, total: number, result: TestCaseResult) => void
  ): Promise<TestCaseResult[]> {
    // Test the 4 primary workflows
    const workflows: WorkflowType[] = [
      'hotel_booking',
      'cab_booking',
      'ecommerce_order',
      'customer_support',
    ];
    const allResults: TestCaseResult[] = [];
    const total = workflows.length * this.testScenarios.length;
    let count = 0;

    for (const wf of workflows) {
      for (let i = 0; i < this.testScenarios.length; i++) {
        const result = await this.runSingleTest(wf, i);
        allResults.push(result);
        count++;
        if (onProgress) {
          onProgress(count, total, result);
        }
      }
    }

    return allResults;
  }
}
