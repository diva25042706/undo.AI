import React from 'react';
import { WorkflowStepSpec } from '../../engine/workflows';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  RotateCcw,
  Mail,
  PhoneCall,
  Sparkles,
  Volume2
} from 'lucide-react';

interface HumanApprovalModalProps {
  step: WorkflowStepSpec | null;
  isOpen: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  step,
  isOpen,
  onApprove,
  onReject,
}) => {
  if (!isOpen || !step) return null;

  const recipientEmail = step.params?.email || 'divakaranperumal2007@gmail.com';
  const recipientPhone = step.params?.phone || '+91-9150390667';
  const customerName = step.params?.user || 'Divakaran';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>IRREVERSIBLE ACTION GUARD • APPROVAL REQUIRED</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Authorize Irreversible External Side-Effect?
            </h3>
          </div>
        </div>

        {/* Action Details Box */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-900 dark:text-white">{step.title}</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px]">
              CANNOT BE UNDONE
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {step.contract.description}
          </p>

          {/* Dual Notification Channels Badge */}
          <div className="p-3 rounded-xl bg-purple-900/20 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-xs space-y-2">
            <div className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Actions Triggered Upon Human Approval:</span>
            </div>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>📧 Real Confirmation Email ➔ <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{recipientEmail}</code></span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <PhoneCall className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>📞 Outbound Voice Confirmation Call ➔ <code className="font-mono font-bold text-purple-600 dark:text-purple-400">{recipientPhone}</code></span>
              </div>
            </div>
          </div>

          {/* Payload Parameters */}
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/60 text-[11px] font-mono space-y-1">
            <div className="text-slate-500">Payload Parameters:</div>
            <pre className="text-indigo-600 dark:text-indigo-400 whitespace-pre-wrap">
              {JSON.stringify({
                user: customerName,
                email: recipientEmail,
                phone: recipientPhone,
                ...step.params,
              }, null, 2)}
            </pre>
          </div>
        </div>

        <div className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">Policy Safeguard:</strong> If rejected, the system will not execute this step and will automatically trigger reverse compensation on all previous completed steps to restore the world state.
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reject & Rollback Previous Steps</span>
          </button>

          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Dispatch Action</span>
          </button>
        </div>

      </div>
    </div>
  );
};
