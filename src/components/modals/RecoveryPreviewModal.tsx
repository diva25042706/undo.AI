import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../../context/AgentContext';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Info,
  Layers,
} from 'lucide-react';

export const RecoveryPreviewModal: React.FC = () => {
  const {
    isRecoveryPreviewOpen,
    setIsRecoveryPreviewOpen,
    activeIncident,
    executeIncidentRecovery,
    addToast,
  } = useAgent();

  if (!isRecoveryPreviewOpen || !activeIncident) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    System Recovery Preview
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {activeIncident.transaction_id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selective recovery plan derived by independent state invariant analysis.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRecoveryPreviewOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Detected Discrepancy Diff */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Contract Discrepancy</span>
                <span className="text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> State Mismatch Detected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> EXPECTED INTENT
                    </span>
                    <span className="font-mono text-[11px]">Contract</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">
                      Recipient: <span className="font-bold text-slate-900 dark:text-white">{activeIncident.expected_recipient}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Amount: <span className="font-bold text-slate-900 dark:text-white">₹{activeIncident.expected_amount.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      Account: {activeIncident.expected_account}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-bold">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> ACTUAL OBSERVED
                    </span>
                    <span className="font-mono text-[11px] text-rose-600 font-bold">{activeIncident.actual_status}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">
                      Recipient: <span className="font-bold text-rose-600 dark:text-rose-400">{activeIncident.actual_recipient}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Amount: <span className="font-bold text-slate-900 dark:text-white">₹{activeIncident.actual_amount.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      Account: {activeIncident.actual_account}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed Recovery Action */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Recommended Action: <span className="font-mono text-indigo-900 dark:text-indigo-200 text-sm ml-1 font-extrabold">{activeIncident.recovery_strategy}</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Confidence: {activeIncident.recovery_confidence}%
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The transaction is in <span className="font-mono font-bold text-slate-900 dark:text-white">{activeIncident.actual_status}</span> state. Mismatch was caught by independent state verifier before remote ledger settlement. Armed checkpoint <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeIncident.checkpoint_id}</span> will be restored to restore exact balances.
              </p>
            </div>

            {/* Impact & Blast Radius Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Blast Radius</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {activeIncident.blast_radius_label} ({activeIncident.blast_radius_fraction})
                </p>
                <p className="text-[10px] text-slate-500">Zero effect on other verified transactions.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Risk Severity</span>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {activeIncident.risk_score}/100 — {activeIncident.risk_level}
                </p>
                <p className="text-[10px] text-slate-500">Autonomous intervention permitted.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Reversibility</span>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fully Reversible
                </p>
                <p className="text-[10px] text-slate-500">Atomic rollback supported.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                setIsRecoveryPreviewOpen(false);
                addToast({
                  type: 'info',
                  title: 'Escalated to Human Review',
                  message: `Incident ${activeIncident.transaction_id} flagged for compliance review.`,
                });
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Flag for Human Review
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsRecoveryPreviewOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await executeIncidentRecovery();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Execute Recovery ({activeIncident.recovery_strategy})</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
