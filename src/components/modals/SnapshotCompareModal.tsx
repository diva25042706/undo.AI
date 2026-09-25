import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../../context/AgentContext';
import { 
  Camera, 
  X, 
  Folder, 
  FileText, 
  ArrowRight, 
  RotateCcw, 
  Plus, 
  Minus, 
  RefreshCw, 
  MoveRight,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { FileNode, FileChangeItem } from '../../types';

export const SnapshotCompareModal: React.FC = () => {
  const { selectedSnapshotForPreview, setSelectedSnapshotForPreview, restoreSnapshot } = useAgent();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!selectedSnapshotForPreview) return null;

  const snap = selectedSnapshotForPreview;

  const handleRestore = async () => {
    setIsRestoring(true);
    await restoreSnapshot(snap.id);
    setIsRestoring(false);
    setSelectedSnapshotForPreview(null);
  };

  const renderFileTree = (nodes: FileNode[], isAfterTree = false) => {
    return (
      <div className="space-y-1 font-mono text-xs">
        {nodes.map((node, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-slate-100/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200">
              <Folder className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold">{node.name}/</span>
            </div>
            {node.children && (
              <div className="pl-4 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3">
                {node.children.map((child, cIdx) => {
                  if (child.type === 'folder') {
                    return (
                      <div key={cIdx} className="space-y-1">
                        <div className="flex items-center justify-between py-1 px-2 rounded-md bg-slate-100/50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2">
                            <Folder className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{child.name}/</span>
                          </div>
                          {child.status === 'added' && isAfterTree && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                              + Added
                            </span>
                          )}
                        </div>
                        {child.children && (
                          <div className="pl-4 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3">
                            {child.children.map((grandChild, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{grandChild.name}</span>
                                </div>
                                {grandChild.status === 'moved' && isAfterTree && (
                                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                                    ↔ Moved
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cIdx}
                      className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{child.name}</span>
                      </div>
                      {isAfterTree && child.status && (
                        <div>
                          {child.status === 'added' && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200">
                              + Added
                            </span>
                          )}
                          {child.status === 'modified' && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-200">
                              ~ Modified
                            </span>
                          )}
                          {child.status === 'moved' && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-200">
                              ↔ Moved
                            </span>
                          )}
                          {child.status === 'removed' && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded border border-rose-200">
                              - Removed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Snapshot Comparison
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparing <span className="font-semibold">{snap.name}</span> checkpoint ({snap.createdAt})
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSnapshotForPreview(null)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body with Side-by-Side Comparison */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Diff Summary Badges */}
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Change Legend:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                <Plus className="w-3 h-3" /> Added
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                <RefreshCw className="w-3 h-3" /> Modified
              </span>
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                <Minus className="w-3 h-3" /> Removed
              </span>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                <MoveRight className="w-3 h-3" /> Moved
              </span>
            </div>

            {/* Before vs After Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* BEFORE Panel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    BEFORE (Baseline State)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">/project/</span>
                </div>
                {renderFileTree(snap.fileTreeBefore, false)}
              </div>

              {/* AFTER Panel */}
              <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-200/80 dark:border-indigo-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    AFTER (Snapshot State)
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">/project/</span>
                </div>
                {renderFileTree(snap.fileTreeAfter, true)}
              </div>

            </div>

            {/* Changes Detailed List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Changes in this Checkpoint ({snap.changes.length})
              </h4>
              <div className="space-y-1.5">
                {snap.changes.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      {ch.type === 'added' && <Plus className="w-3.5 h-3.5 text-emerald-500" />}
                      {ch.type === 'modified' && <RefreshCw className="w-3.5 h-3.5 text-amber-500" />}
                      {ch.type === 'removed' && <Minus className="w-3.5 h-3.5 text-rose-500" />}
                      {ch.type === 'moved' && <MoveRight className="w-3.5 h-3.5 text-blue-500" />}
                      <span className="text-slate-800 dark:text-slate-200">{ch.path}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans">{ch.details}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{snap.filesChangedCount} changes</span> detected in this snapshot.
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={isRestoring}
                onClick={() => setSelectedSnapshotForPreview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>

              <button
                disabled={isRestoring}
                onClick={handleRestore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restoring Snapshot...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore This Snapshot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
