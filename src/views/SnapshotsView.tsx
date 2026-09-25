import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import {
  Camera,
  Layers,
  RotateCcw,
  Eye,
  Clock,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Plus,
  ArrowDown,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const SnapshotsView: React.FC = () => {
  const {
    snapshots,
    setSelectedSnapshotForPreview,
    restoreSnapshot,
    addToast,
  } = useAgent();

  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setIsRestoringId(id);
    await restoreSnapshot(id);
    setIsRestoringId(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Time Travel Checkpoints</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Snapshots & Time Travel
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Restore your entire workspace to any previous point in time with instant diff reconciliation.
          </p>
        </div>

        <button
          onClick={() => {
            addToast({
              type: 'success',
              title: 'Manual Snapshot Created',
              message: 'Checkpoint SNAP-05 generated and verified safe.',
            });
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Safe Checkpoint</span>
        </button>
      </div>

      {/* Time Travel Timeline Flow */}
      <div className="space-y-6 relative before:absolute before:top-4 before:bottom-4 before:left-4 sm:before:left-6 before:w-0.5 before:bg-linear-to-b before:from-indigo-500 via-indigo-200 to-slate-200 dark:via-indigo-900 dark:to-slate-800">
        
        {/* NOW indicator */}
        <div className="flex items-center gap-4 pl-1 sm:pl-3">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-indigo-500/20 shadow-md z-10">
            ●
          </div>
          <div className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>NOW (Current Active State)</span>
          </div>
        </div>

        {/* Snapshots Cards */}
        {snapshots.map((snap, index) => {
          const isRestoring = isRestoringId === snap.id;

          return (
            <motion.div
              key={snap.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="pl-8 sm:pl-12 relative group"
            >
              {/* Timeline marker icon */}
              <div
                className={`absolute left-2 sm:left-4 top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] z-10 transition-all ${
                  snap.isCurrent
                    ? 'bg-emerald-500 border-white text-white ring-4 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                {snap.isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
              </div>

              {/* Snapshot Card */}
              <div
                className={`glass-panel p-6 rounded-3xl shadow-xs border transition-all ${
                  snap.isCurrent
                    ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  
                  {/* Left details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {snap.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        Created {snap.relativeTime}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {snap.status}
                      </span>
                      {snap.isCurrent && (
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          Active Workspace State
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {snap.description}
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-4 pt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Actions: <strong className="text-slate-800 dark:text-slate-200">{snap.actionsCount}</strong></span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Changes: <strong className="text-slate-800 dark:text-slate-200">{snap.filesChangedCount} files</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedSnapshotForPreview(snap)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      disabled={snap.isCurrent || isRestoring}
                      onClick={() => handleRestore(snap.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Restoring...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Snapshot</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          );
        })}

      </div>

    </div>
  );
};
