import React from 'react';
import { useAgent } from '../context/AgentContext';
import {
  ShieldCheck,
  ShieldAlert,
  FileCode2,
  Mail,
  CreditCard,
  Cpu,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
} from 'lucide-react';

export const PoliciesView: React.FC = () => {
  const {
    policies,
    togglePolicy,
    requireApprovalIrreversible,
    setRequireApprovalIrreversible,
    addToast,
  } = useAgent();

  const fileOps = policies.filter((p) => p.category === 'file_ops');
  const comms = policies.filter((p) => p.category === 'communication');
  const finance = policies.filter((p) => p.category === 'finance');
  const system = policies.filter((p) => p.category === 'system');

  const renderPolicySection = (
    title: string,
    description: string,
    icon: React.ComponentType<{ className?: string }>,
    rules: typeof policies,
    colorClass: string
  ) => {
    const Icon = icon;

    return (
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className={`p-2 rounded-xl ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rule.name}
                  </span>
                  {rule.requiresApproval && (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                      Approval Gate
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {rule.description}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => togglePolicy(rule.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Agent Governance Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Control What Your Agent Can Do
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set strict operational boundaries, automatic approval triggers, and irreversible action shields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            11 Policies Active
          </span>
        </div>
      </div>

      {/* Master Irreversible Override Toggle Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-indigo-700/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold">
              Require approval for irreversible actions
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed max-w-xl">
            When enabled, any action that cannot be 100% rolled back (e.g. permanent deletion, live email dispatch) is halted for human confirmation.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
          <input
            type="checkbox"
            checked={requireApprovalIrreversible}
            onChange={(e) => {
              setRequireApprovalIrreversible(e.target.checked);
              addToast({
                type: e.target.checked ? 'success' : 'warning',
                title: 'Master Policy Toggled',
                message: `Irreversible safety gate is now ${e.target.checked ? 'STRICTLY ENFORCED' : 'DISABLED'}`,
              });
            }}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {/* Policy Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderPolicySection(
          'FILE OPERATIONS',
          'Manage local workspace file system permissions and renaming.',
          FileCode2,
          fileOps,
          'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
        )}

        {renderPolicySection(
          'COMMUNICATION',
          'Control outgoing emails, Slack dispatches, and public webhooks.',
          Mail,
          comms,
          'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
        )}

        {renderPolicySection(
          'FINANCE & BILLING',
          'Autonomous purchases, refunds, and corporate card access.',
          CreditCard,
          finance,
          'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
        )}

        {renderPolicySection(
          'SYSTEM & SHELL',
          'Low-level terminal commands, environment variables, and memory.',
          Cpu,
          system,
          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
        )}
      </div>

    </div>
  );
};
