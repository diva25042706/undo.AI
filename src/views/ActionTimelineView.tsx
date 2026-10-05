import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { durableLogInstance, DurableLogEntry } from '../engine/durableLog';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Lock,
  Terminal,
  Database,
  Mail,
} from 'lucide-react';

export const ActionTimelineView: React.FC = () => {
  const { sagaState, resetWorld } = useAgent();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'compensated' | 'failed'>('all');

  const allLogs = durableLogInstance.getAllLogs();

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.workflowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.idempotencyKey.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'completed') return log.status === 'COMPLETED';
    if (filterType === 'compensated') return log.status === 'COMPENSATED';
    if (filterType === 'failed') return log.status === 'FAILED' || log.status === 'COMPENSATION_FAILED';

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>IMMUTABLE DURABLE EXECUTION LOG & IDEMPOTENCY LEDGER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Action Timeline & Durable Log
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {allLogs.length} Durable Log Entries
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, tool, workflow ID or key..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Entries' },
            { id: 'completed', label: 'Completed' },
            { id: 'compensated', label: 'Compensated' },
            { id: 'failed', label: 'Failed / Escalated' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
            <Terminal className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No Durable Log Entries Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Execute a workflow from the Dashboard or Workspace to record real-time step side-effects and compensation events.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredLogs.map((log) => {
              const isCompensated = log.status === 'COMPENSATED';
              const isFailed = log.status === 'FAILED' || log.status === 'COMPENSATION_FAILED';
              const isCompleted = log.status === 'COMPLETED' || log.status === 'FULLY_RESTORED';
              const isVerified = log.status === 'VERIFIED';
              const isSent = log.status === 'SENT';
              const isEmailFailed = log.status === 'EMAIL_FAILED';
              const isStarted = log.status === 'STARTED';

              return (
                <div key={log.logId} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center ${
                      isCompensated
                        ? 'border-purple-500 text-purple-500'
                        : isFailed
                        ? 'border-rose-500 text-rose-500'
                        : isSent || isVerified || isCompleted
                        ? 'border-emerald-500 text-emerald-500'
                        : isEmailFailed
                        ? 'border-amber-500 text-amber-500'
                        : 'border-indigo-400 text-indigo-400'
                    }`}
                  >
                    {isCompensated ? (
                      <RotateCcw className="w-2.5 h-2.5" />
                    ) : isFailed ? (
                      <XCircle className="w-2.5 h-2.5" />
                    ) : isSent ? (
                      <Mail className="w-2.5 h-2.5" />
                    ) : isVerified ? (
                      <ShieldCheck className="w-2.5 h-2.5" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <Clock className="w-2.5 h-2.5" />
                    )}
                  </div>

                  {/* Entry Card */}
                  <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:border-indigo-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {log.timestamp}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {log.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {log.workflowId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompensated
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : isFailed
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isSent || isVerified || isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isEmailFailed
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {log.status}
                        </span>

                        {log.requiresApproval && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> APPROVAL REQ
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                      {log.sideEffectDesc || log.action}
                    </p>

                    {log.compensationDesc && (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Compensation Record: </span>
                          <span>{log.compensationDesc}</span>
                        </div>
                      </div>
                    )}

                    {log.errorMessage && (
                      <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-900 dark:text-rose-200 flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Fault / Error Detail: </span>
                          <span>{log.errorMessage}</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono gap-2">
                      <div className="flex items-center gap-3">
                        <span>idempotency_key: {log.idempotencyKey}</span>
                        <span>tool: {log.toolName}()</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>Reversible: {log.reversible ? 'YES' : 'NO'}</span>
                        <span>•</span>
                        <span>Idempotent: {log.idempotent ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
