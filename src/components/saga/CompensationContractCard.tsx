import React from 'react';
import { CompensationContract } from '../../engine/compensationContracts';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CompensationContractCardProps {
  contract: CompensationContract;
  isCurrent?: boolean;
  stepNumber?: number;
}

export const CompensationContractCard: React.FC<CompensationContractCardProps> = ({
  contract,
  isCurrent = false,
  stepNumber,
}) => {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isCurrent
          ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          {stepNumber && (
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {stepNumber}
            </span>
          )}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {contract.displayName}
            </h4>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
              tool: {contract.toolName}()
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {contract.reversible ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              REVERSIBLE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              IRREVERSIBLE
            </span>
          )}

          {contract.requiresApproval && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              APPROVAL REQ
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
        {contract.description}
      </p>

      {/* Contract Metadata Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Forward Action
          </span>
          <code className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
            {contract.action}
          </code>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Compensation Action
          </span>
          {contract.compensationAction ? (
            <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              {contract.compensationAction}
            </code>
          ) : (
            <span className="text-slate-400 font-mono italic">None (Irreversible)</span>
          )}
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Idempotency Safe
          </span>
          <span className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {contract.idempotent ? 'Yes (Keyed Check)' : 'No'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Rollback Strategy
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {contract.rollbackStrategy}
          </span>
        </div>
      </div>
    </div>
  );
};
