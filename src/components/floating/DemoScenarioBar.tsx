import React from 'react';
import { useAgent } from '../../context/AgentContext';
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
} from 'lucide-react';

export const DemoScenarioBar: React.FC = () => {
  const { isDemoRunning, demoStep, cancelDemo, setActiveTab, resetToDefault } = useAgent();

  if (!isDemoRunning) return null;

  const steps = [
    { step: 1, title: '1. User Request', desc: 'User commands agent to organize project' },
    { step: 2, title: '2. Expected State', desc: 'Formulates state contract & invariants' },
    { step: 3, title: '3. Risk Scoring', desc: 'Score 24/100 (AUTO_EXECUTE policy)' },
    { step: 4, title: '4. Checkpoint CP-001', desc: 'Captures physical disk & SHA hash' },
    { step: 5, title: '5. Tool Execution', desc: 'Executes file operations in sandbox' },
    { step: 6, title: '6. Controlled Failure', desc: 'architecture.pdf left in root' },
    { step: 7, title: '7. Independent Verifier', desc: 'Detects state deviation without LLM' },
    { step: 8, title: '8. Recovery Engine', desc: 'Selects ROLLBACK & DAG sequence' },
    { step: 9, title: '9. Restore CP-001', desc: 'Reverts physical files & DB state' },
    { step: 10, title: '10. State Safe', desc: 'Re-verified: Baseline restored' },
  ];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-5xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-2xl p-4 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            Hackathon Live Proof (AG02)
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Scenario: “The Agent With An Undo Button — Autonomous Reversible Recovery Engine”
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Scenario"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={cancelDemo}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Steps Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 pt-1">
        {steps.map((s) => {
          const isCompleted = demoStep > s.step;
          const isCurrent = demoStep === s.step;

          return (
            <div
              key={s.step}
              className={`p-1.5 rounded-xl border text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                  : isCompleted
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span
                    className={`w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s.step}
                  </span>
                )}
                <span className={`text-[10px] font-bold truncate ${isCurrent ? 'text-indigo-950 dark:text-indigo-200' : ''}`}>
                  {s.title}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
