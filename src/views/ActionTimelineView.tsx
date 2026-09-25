import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ActionTimelineView: React.FC = () => {
  const {
    actions,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
  } = useAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'reversible' | 'undone' | 'high_risk'>('all');

  const filteredActions = actions.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'reversible') return a.reversible && a.status === 'completed';
    if (filterType === 'undone') return a.status === 'undone';
    if (filterType === 'high_risk') return a.risk === 'high' || a.risk === 'medium';

    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Traceable Audit Stream</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Action Timeline
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {actions.length} Total Events Logged
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
            placeholder="Search actions, files, agents or ACT-IDs..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'reversible', label: 'Reversible' },
            { id: 'undone', label: 'Recently Undone' },
            { id: 'high_risk', label: 'High & Medium Risk' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
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

      {/* Vertical Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-linear-to-b before:from-indigo-500 before:via-slate-200 before:to-slate-200 dark:before:via-slate-800 dark:before:to-slate-800">
        
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            No matching actions found for the active filter.
          </div>
        ) : (
          filteredActions.map((action, index) => {
            const isLatest = index === 0;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="relative group"
              >
                {/* Timeline Dot Marker */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-xs ${
                    action.status === 'undone'
                      ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-600'
                      : isLatest
                      ? 'bg-indigo-600 border-white dark:border-slate-900 text-white ring-4 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {action.status === 'undone' ? (
                    <RotateCcw className="w-3 h-3" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>

                {/* Timeline Action Card */}
                <div className="glass-panel p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    
                    {/* Action Meta & Title */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {action.timestamp}
                        </span>
                        <span className="text-xs font-mono text-slate-400">({action.timeAgo})</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {action.agentAvatar} {action.agentName}
                        </span>
                        <RiskBadge risk={action.risk} size="sm" />
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {action.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {action.actionSummary}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span>Target: <span className="text-slate-800 dark:text-slate-200 font-semibold">{action.target}</span></span>
                        <span>•</span>
                        <span>Reversible: <span className={action.reversible ? 'text-emerald-600 font-bold' : 'text-slate-400'}>{action.reversible ? 'YES' : 'NO'}</span></span>
                        {action.snapshotId && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{action.snapshotId}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <StatusBadge status={action.status} size="sm" />

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setSelectedActionForDetails(action)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        >
                          View Details
                        </button>

                        {action.reversible && action.status === 'completed' && (
                          <button
                            onClick={() => setSelectedActionForUndo(action)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })
        )}

      </div>

    </div>
  );
};
