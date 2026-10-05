import React from 'react';
import { useAgent } from '../../context/AgentContext';
import { WORKFLOW_DEFINITIONS } from '../../engine/workflows';
import { 
  Sparkles, 
  X, 
  Play, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  PowerOff,
  Flame,
} from 'lucide-react';

export const DemoScenarioBar: React.FC = () => {
  const {
    sagaState,
    selectWorkflow,
    setFaultInjection,
    runWorkflow,
    resetWorld,
    setIsTestMatrixOpen,
    isDemoRunning,
    cancelDemo,
  } = useAgent();

  const isRunning = sagaState.status === 'RUNNING' || sagaState.status === 'COMPENSATING';

  return (
    <div className="sticky top-16 z-30 w-full bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-lg border-b border-indigo-800/60 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-400/30 text-[10px]">
            <Sparkles className="w-3 h-3 text-indigo-300 animate-spin" />
            <span>AG02 LIVE CONTROLLER</span>
          </div>

          {/* Workflow Quick Select */}
          <select
            disabled={isRunning}
            value={sagaState.workflowType}
            onChange={(e) => selectWorkflow(e.target.value as any)}
            className="bg-indigo-900/80 border border-indigo-700/80 text-white font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="hotel_booking">🏨 Hotel Booking (T. Nagar)</option>
            <option value="ecommerce_order">📦 E-Commerce Order (Velachery)</option>
            <option value="customer_support">🎧 Customer Support (Anna Nagar)</option>
            <option value="restaurant_reservation">🍽️ Restaurant Table (Mylapore)</option>
            <option value="cab_booking">🚕 Cab / Ride Booking (OMR)</option>
            <option value="event_registration">🎟️ Event Tech Summit (Guindy)</option>
            <option value="delivery">🚚 Parcel Delivery (Tambaram)</option>
            <option value="appointment_booking">🩺 Clinical Appointment (Apollo)</option>
          </select>

          {/* Fault Quick Select */}
          <select
            disabled={isRunning}
            value={sagaState.faultInjection}
            onChange={(e) => setFaultInjection(e.target.value as any)}
            className="bg-indigo-900/80 border border-indigo-700/80 text-white font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="NONE">✓ Happy Path (No Fault)</option>
            <option value="FAIL_STEP_1">⚠ Fail Step 1</option>
            <option value="FAIL_STEP_2">⚠ Fail Step 2</option>
            <option value="FAIL_STEP_3">⚠ Fail Step 3</option>
            <option value="FAIL_STEP_4">⚠ Fail Step 4 (Judge Recommended)</option>
            <option value="CRASH_AFTER_STEP_1">⚡ Crash After Step 1</option>
            <option value="CRASH_AFTER_STEP_2">⚡ Crash After Step 2</option>
            <option value="CRASH_AFTER_STEP_3">⚡ Crash After Step 3</option>
            <option value="FAIL_COMPENSATION">🔥 Fail Compensation (Human Escalation)</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            disabled={isRunning}
            onClick={() => runWorkflow()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Run Workflow</span>
          </button>

          <button
            disabled={isRunning}
            onClick={resetWorld}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
            title="Reset Mocked World to Clean Baseline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset World</span>
          </button>

          <button
            onClick={() => setIsTestMatrixOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-500/40 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Test Matrix</span>
          </button>
        </div>

      </div>
    </div>
  );
};
