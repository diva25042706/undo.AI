import React, { useState } from 'react';
import { TestMatrixRunner, TestCaseResult } from '../../engine/testMatrix';
import { 
  FileSpreadsheet, 
  Play, 
  CheckCircle2, 
  XCircle, 
  X, 
  RotateCcw, 
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Layers
} from 'lucide-react';

interface TestMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestMatrixModal: React.FC<TestMatrixModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 27 });

  if (!isOpen) return null;

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress({ current: 0, total: 40 });

    const collectedResults: TestCaseResult[] = [];

    await TestMatrixRunner.runAllTests((current, total, result) => {
      collectedResults.push(result);
      setResults([...collectedResults]);
      setProgress({ current, total });
    });

    setIsRunning(false);
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BUILDATHON 2026 AG02 VERIFICATION SUITE</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Multi-Workflow Saga Test Matrix ({results.length > 0 ? results.length : 40} Scenarios)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Summary Bar */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              disabled={isRunning}
              onClick={handleRunAllTests}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Tests ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Complete Multi-Workflow Matrix (40 Tests)</span>
                </>
              )}
            </button>
          </div>

          {results.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Passed: {passCount}/{results.length}</span>
              </span>
              {failCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Failed: {failCount}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {results.length === 0 && !isRunning && (
            <div className="text-center py-12 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Test Matrix Ready for Execution
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Evaluates Hotel Booking, E-Commerce Order, and Customer Support across Happy Path, Failures at steps 1..4, Crashes at steps 1..3, and Compensation Failures.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Test ID</th>
                    <th className="p-3">Workflow</th>
                    <th className="p-3">Scenario / Fault</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">World Invariant</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Verification Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {results.map((r) => (
                    <tr
                      key={r.testId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3 font-mono text-[11px] text-slate-500">{r.testId}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {r.workflowName}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {r.scenarioName}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'PASS'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {r.status === 'PASS' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold text-[11px] ${
                            r.isWorldRestored
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {r.isWorldRestored ? 'RESTORED ✓' : 'MUTATED / ESCALATED'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{r.durationMs}ms</td>
                      <td className="p-3 text-slate-500 text-[11px] truncate max-w-xs">
                        {r.actualOutcome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>Deterministic execution engine guarantees 100% reproducible results for judges.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
