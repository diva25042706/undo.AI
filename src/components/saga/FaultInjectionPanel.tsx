import React, { useState } from 'react';
import { WorkflowType, WORKFLOW_DEFINITIONS, CHENNAI_AREAS, WorkflowCustomer } from '../../engine/workflows';
import { FaultInjectionOption, WorkflowRuntimeState } from '../../engine/sagaEngine';
import { 
  AlertTriangle, 
  Bug, 
  Play, 
  RefreshCw, 
  Zap, 
  Flame, 
  PowerOff, 
  RotateCcw,
  FileSpreadsheet,
  Settings2,
  User,
  MapPin,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FaultInjectionPanelProps {
  sagaState: WorkflowRuntimeState;
  onSelectWorkflow: (type: WorkflowType, customParams?: Record<string, any>, customCustomer?: Partial<WorkflowCustomer>) => void;
  onSelectFault: (fault: FaultInjectionOption) => void;
  onRunWorkflow: (customParams?: Record<string, any>, customCustomer?: Partial<WorkflowCustomer>) => void;
  onResetWorld: () => void;
  onOpenTestMatrix: () => void;
  isRunning: boolean;
}

export const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({
  sagaState,
  onSelectWorkflow,
  onSelectFault,
  onRunWorkflow,
  onResetWorld,
  onOpenTestMatrix,
  isRunning,
}) => {
  const selectedWorkflow = sagaState.workflowType;
  const faultInjection = sagaState.faultInjection;
  const currentWorkflowDef = WORKFLOW_DEFINITIONS[selectedWorkflow];
  const totalSteps = currentWorkflowDef.stepsCount || 5;

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customerName, setCustomerName] = useState(sagaState.instance.customer.name || 'Divakaran');
  const [customerEmail, setCustomerEmail] = useState(sagaState.instance.customer.email || 'divakaranperumal27@gmail.com');
  const [customAmount, setCustomAmount] = useState<number>(() => {
    if (selectedWorkflow === 'hotel_booking') return sagaState.instance.parameters.roomPrice || 750.0;
    if (selectedWorkflow === 'cab_booking') return sagaState.instance.parameters.fare || 420.0;
    if (selectedWorkflow === 'ecommerce_order') return sagaState.instance.parameters.price || 85000.0;
    if (selectedWorkflow === 'customer_support') return sagaState.instance.parameters.creditAmount || 500.0;
    return currentWorkflowDef.defaultAmount;
  });
  const [selectedArea, setSelectedArea] = useState(() => {
    if (selectedWorkflow === 'hotel_booking') return sagaState.instance.parameters.area || sagaState.instance.parameters.searchLocation || 'Nungambakkam';
    if (selectedWorkflow === 'cab_booking') return sagaState.instance.parameters.pickup || 'Thiruvanmiyur';
    if (selectedWorkflow === 'ecommerce_order') return sagaState.instance.parameters.deliveryArea || 'Velachery';
    if (selectedWorkflow === 'customer_support') return sagaState.instance.parameters.customerArea || 'Adyar';
    return currentWorkflowDef.defaultArea;
  });

  // Sync state whenever workflow type or active instance changes
  React.useEffect(() => {
    const params = sagaState.instance.parameters || {};
    if (selectedWorkflow === 'hotel_booking') {
      setCustomAmount(params.roomPrice !== undefined ? params.roomPrice : 750.0);
      setSelectedArea(params.area || params.searchLocation || 'Nungambakkam');
    } else if (selectedWorkflow === 'cab_booking') {
      setCustomAmount(params.fare !== undefined ? params.fare : 420.0);
      setSelectedArea(params.pickup || 'Thiruvanmiyur');
    } else if (selectedWorkflow === 'ecommerce_order') {
      setCustomAmount(params.price !== undefined ? params.price : 85000.0);
      setSelectedArea(params.deliveryArea || 'Velachery');
    } else if (selectedWorkflow === 'customer_support') {
      setCustomAmount(params.creditAmount !== undefined ? params.creditAmount : 500.0);
      setSelectedArea(params.customerArea || 'Adyar');
    }
  }, [selectedWorkflow, sagaState.instance.instanceId]);

  const handleApplyCustomParams = () => {
    const customParams: Record<string, any> = {};
    if (selectedWorkflow === 'cab_booking') {
      customParams.fare = Number(customAmount);
      customParams.pickup = selectedArea;
    } else if (selectedWorkflow === 'hotel_booking') {
      customParams.roomPrice = Number(customAmount);
      customParams.area = selectedArea;
      customParams.searchLocation = selectedArea;
    } else if (selectedWorkflow === 'ecommerce_order') {
      customParams.price = Number(customAmount);
      customParams.deliveryArea = selectedArea;
    } else if (selectedWorkflow === 'customer_support') {
      customParams.creditAmount = Number(customAmount);
      customParams.customerArea = selectedArea;
    }

    const customCust: Partial<WorkflowCustomer> = {
      name: customerName,
      email: customerEmail,
    };

    onSelectWorkflow(selectedWorkflow, customParams, customCust);
  };

  const handleRun = () => {
    let customParams: Record<string, any> | undefined = undefined;
    if (isCustomizing) {
      customParams = {};
      if (selectedWorkflow === 'cab_booking') {
        customParams.fare = Number(customAmount);
        customParams.pickup = selectedArea;
      } else if (selectedWorkflow === 'hotel_booking') {
        customParams.roomPrice = Number(customAmount);
        customParams.area = selectedArea;
        customParams.searchLocation = selectedArea;
      } else if (selectedWorkflow === 'ecommerce_order') {
        customParams.price = Number(customAmount);
        customParams.deliveryArea = selectedArea;
      } else if (selectedWorkflow === 'customer_support') {
        customParams.creditAmount = Number(customAmount);
        customParams.customerArea = selectedArea;
      }
    }

    const customCust: Partial<WorkflowCustomer> = {
      name: customerName,
      email: customerEmail,
    };

    onRunWorkflow(customParams, customCust);
  };

  return (
    <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
            <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>BUILDATHON AG02 DYNAMIC SAGA CONTROLLER</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Transactional Execution & Fault Orchestrator
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <span>{isCustomizing ? 'Hide Parameters' : 'Edit Parameters'}</span>
            {isCustomizing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenTestMatrix}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Open Test Matrix</span>
          </button>
        </div>
      </div>

      {/* Row 1: Workflow Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          1. Select Multi-Step Agent Workflow
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(WORKFLOW_DEFINITIONS).slice(0, 4).map((wf) => {
            const isSelected = selectedWorkflow === wf.id;
            return (
              <button
                key={wf.id}
                disabled={isRunning}
                onClick={() => onSelectWorkflow(wf.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{wf.avatar}</span>
                    <span className="truncate">{wf.name.split('(')[0].trim()}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {wf.currencySymbol}{wf.defaultAmount.toLocaleString()}
                  </span>
                </div>
                <div className={`text-[10px] font-mono mb-1 ${isSelected ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
                  📍 {wf.defaultArea}
                </div>
                <p className={`text-[11px] leading-tight line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {wf.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Parameter Editor Drawer */}
      {isCustomizing && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              Runtime Instance Parameters (Customer, Location, Amount)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Instance ID: {sagaState.workflowId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Customer Email (Live Resend Recipient)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Location / Area
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              >
                {CHENNAI_AREAS.slice(0, 15).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Workflow Amount ({currentWorkflowDef.currencySymbol})
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleApplyCustomParams}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Apply Instance Parameters
            </button>
          </div>
        </div>
      )}

      {/* Row 2: Injected Failure Position & Crash Points (Dynamically Sized to Step Length) */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          2. Inject Fault / Crash Point / Compensation Failure ({totalSteps} Steps Pipeline)
        </label>

        {/* Dynamic Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Happy Path */}
          <button
            disabled={isRunning}
            onClick={() => onSelectFault('NONE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              faultInjection === 'NONE'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            ✓ Happy Path (No Fault)
          </button>

          {/* Dynamic Step Failures */}
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => {
            const faultKey =
              selectedWorkflow === 'hotel_booking' && stepNum === 5
                ? ('FAIL_CREATE_BOOKING_TICKET' as FaultInjectionOption)
                : (`FAIL_STEP_${stepNum}` as FaultInjectionOption);

            const isSelected =
              faultInjection === faultKey ||
              (selectedWorkflow === 'hotel_booking' && stepNum === 5 && (faultInjection === 'FAIL_STEP_5' || faultInjection === 'FAIL_CREATE_BOOKING_TICKET'));

            const stepObj = sagaState.instance.steps.find((s) => s.stepNumber === stepNum);
            let label = `Fail Step ${stepNum}`;
            if (stepNum === 5) {
              if (selectedWorkflow === 'hotel_booking') {
                label = 'Fail Step 5 (Create Ticket ❌)';
              } else if (selectedWorkflow === 'ecommerce_order') {
                label = 'Fail Step 5 (Shipment Label ❌)';
              } else if (selectedWorkflow === 'customer_support') {
                label = 'Fail Step 5 (Resolution Credit ❌)';
              } else if (selectedWorkflow === 'cab_booking') {
                label = 'Fail Step 5 (Dispatch OTP ❌)';
              }
            } else if (selectedWorkflow === 'hotel_booking' && stepNum === 4) {
              label = 'Fail Step 4 (Charge Payment)';
            } else if (selectedWorkflow === 'ecommerce_order' && stepNum === 4) {
              label = 'Fail Step 4 (Capture Payment)';
            } else if (selectedWorkflow === 'customer_support' && stepNum === 4) {
              label = 'Fail Step 4 (Upgrade Priority)';
            }

            return (
              <button
                key={faultKey}
                disabled={isRunning}
                onClick={() => onSelectFault(faultKey)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
                title={stepObj?.title}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}

          {/* Dynamic Crash Points */}
          {Array.from({ length: Math.max(1, totalSteps - 1) }, (_, i) => i + 1).map((stepNum) => {
            const crashKey = `CRASH_AFTER_STEP_${stepNum}` as FaultInjectionOption;
            const isSelected = faultInjection === crashKey;
            return (
              <button
                key={crashKey}
                disabled={isRunning}
                onClick={() => onSelectFault(crashKey)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Crash After Step {stepNum}</span>
              </button>
            );
          })}

          {/* Compensation Failure */}
          <button
            disabled={isRunning}
            onClick={() => onSelectFault('FAIL_COMPENSATION')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              faultInjection === 'FAIL_COMPENSATION'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Fail Compensation (Human Escalation)</span>
          </button>
        </div>
      </div>

      {/* Row 3: Action Controls */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            disabled={isRunning}
            onClick={handleRun}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute Workflow Instance</span>
          </button>

          <button
            disabled={isRunning}
            onClick={onResetWorld}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset World Baseline</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Active Instance: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{sagaState.workflowId}</span> • Customer: <strong className="text-slate-800 dark:text-slate-200">{sagaState.instance.customer.name}</strong> • Fault: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{faultInjection}</span>
        </div>
      </div>
    </div>
  );
};
