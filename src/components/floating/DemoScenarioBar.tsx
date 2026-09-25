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
  RefreshCw
} from 'lucide-react';

export const DemoScenarioBar: React.FC = () => {
  const { isDemoRunning, demoStep, cancelDemo, setActiveTab, resetToDefault } = useAgent();

  if (!isDemoRunning) return null;

  const steps = [
    { step: 1, title: 'User Request', desc: 'User commands agent to organize project' },
    { step: 2, title: 'Plan & Safety Check', desc: 'Agent categorizes safe vs irreversible actions' },
    { step: 3, title: 'Human Approval Gate', desc: 'High-risk deletion requires confirmation' },
    { step: 4, title: 'Execution & Checkpoint', desc: 'Safe actions execute & create snapshot' },
    { step: 5, title: 'Reversibility & Undo', desc: '1-click rollback restores prior state' },
  ];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-2xl p-4 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Hackathon Demo Guide
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Scenario: “AI Project Organizer with Undo Safety”
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Scenario"
          >
            <RefreshCw className="w-3 h-3" />
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
      <div className="grid grid-cols-5 gap-2 pt-1">
        {steps.map((s) => {
          const isCompleted = demoStep > s.step;
          const isCurrent = demoStep === s.step;

          return (
            <div
              key={s.step}
              className={`p-2 rounded-xl border text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                  : isCompleted
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s.step}
                  </span>
                )}
                <span className={`text-[11px] font-bold truncate ${isCurrent ? 'text-indigo-950 dark:text-indigo-200' : ''}`}>
                  {s.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
