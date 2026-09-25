import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  Bot,
  Send,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  FolderTree,
  Folder,
  FileText,
  FileCode,
  ArrowRight,
  Loader2,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const AgentWorkspaceView: React.FC = () => {
  const {
    addNewAction,
    addToast,
    setSelectedActionForUndo,
    setSelectedActionForDetails,
    isDemoRunning,
    undoLastAction,
  } = useAgent();

  const [inputMessage, setInputMessage] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [hasPlanProposed, setHasPlanProposed] = useState(true);
  const [planApproved, setPlanApproved] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [requiresApprovalConfirmed, setRequiresApprovalConfirmed] = useState(false);

  const planItems = [
    { id: 1, title: 'Create /docs folder', target: '/project/docs', type: 'create_folder', safe: true, risk: 'low' as const },
    { id: 2, title: 'Move README.md to /docs', target: 'README.md', type: 'move_file', safe: true, risk: 'low' as const },
    { id: 3, title: 'Move architecture.pdf to /docs', target: 'architecture.pdf', type: 'move_file', safe: true, risk: 'low' as const },
    { id: 4, title: 'Rename final_report.pdf -> final_report_v2.pdf', target: 'final_report.pdf', type: 'rename_file', safe: true, risk: 'low' as const },
    { id: 5, title: 'Delete 2 duplicate cache files', target: 'tmp/cache-old.log', type: 'delete_file', safe: false, risk: 'high' as const, note: 'Irreversible action: Requires explicit human override' },
  ];

  const handleExecuteSafeActions = async () => {
    setPlanApproved(true);
    setIsExecuting(true);
    setExecutionProgress(10);

    for (let i = 0; i < planItems.length; i++) {
      const item = planItems[i];
      if (!item.safe && !requiresApprovalConfirmed) {
        // Skip high-risk action until approved
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      setCompletedSteps((prev) => [...prev, item.id]);
      setExecutionProgress(((i + 1) / (requiresApprovalConfirmed ? 5 : 4)) * 100);

      // Register into global undo actions
      addNewAction({
        agentId: 'agent-1',
        agentName: 'Workspace Agent',
        agentAvatar: '🤖',
        agentRole: 'Workspace Organizer',
        type: item.type as any,
        title: item.title,
        actionSummary: `${item.title} during automated reorganization`,
        target: item.target,
        destPath: item.target.startsWith('/project') ? item.target : `/project/${item.target}`,
        previousStateDesc: `Original baseline location for ${item.target}`,
        newStateDesc: `Organized path: ${item.target}`,
        reason: 'Automated documentation & asset cleanup pass.',
        risk: item.risk,
        status: 'completed',
        reversible: item.safe,
        rollbackAvailable: item.safe,
        impact: item.safe ? 'File will revert to previous directory.' : 'File deletion cannot be restored without tape backup.',
        affectedFiles: [item.target],
      });
    }

    setIsExecuting(false);
    addToast({
      type: 'success',
      title: 'Agent Workflow Completed',
      message: 'Safe actions executed successfully with automated rollback checkpoints.',
    });
  };

  const handleApproveHighRisk = () => {
    setRequiresApprovalConfirmed(true);
    addToast({
      type: 'warning',
      title: 'High-Risk Override Granted',
      message: 'Irreversible deletion authorized by user admin.',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Autonomous Agent Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agent Workspace
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Protected by Undo Engine
          </span>
        </div>
      </div>

      {/* Grid Layout: Left Chat & Proposal (3 cols) | Right Virtual File Inspector (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Chat Conversation & Action Plan (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Conversation History */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
            
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-md bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-xs text-xs sm:text-sm leading-relaxed shadow-md shadow-indigo-600/20">
                <p className="font-semibold text-indigo-100 text-[11px] mb-1">You (User)</p>
                <p>“Organize my project documentation and clean up unused files.”</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                JD
              </div>
            </div>

            {/* Agent Proposal Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center justify-center shrink-0">
                🤖
              </div>
              <div className="max-w-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl rounded-tl-xs text-xs sm:text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Workspace Research Agent
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Verified Safe</span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  I can do that! I inspected your directory structure and found 14 files.
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Before I proceed:</p>
                  <p>• 4 files will be organized and moved to /docs</p>
                  <p>• 1 file will be standardized in version name</p>
                  <p>• 2 duplicate temp cache files identified for deletion</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                    ✓ All file move/rename operations will be 100% reversible via Undo Engine.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION PLAN CARD */}
            <div className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/60">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    ACTION PLAN
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Proposed Reversible Execution Steps
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    4 SAFE ACTIONS
                  </span>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                    1 REQUIRES APPROVAL
                  </span>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-2">
                {planItems.map((item) => {
                  const isDone = completedSteps.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : item.safe
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : item.safe ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          {item.note && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <RiskBadge risk={item.risk} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Execution Progress when active */}
              {isExecuting && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Executing safe checkpoints...
                    </span>
                    <span className="font-bold text-indigo-600">{Math.round(executionProgress)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-indigo-600 h-2 rounded-full"
                      animate={{ width: `${executionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Plan Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2">
                  {!requiresApprovalConfirmed && (
                    <button
                      onClick={handleApproveHighRisk}
                      className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      Authorize Deletion (High Risk)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isExecuting}
                    onClick={handleExecuteSafeActions}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Executing Plan...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Approve & Execute Safe Actions</span>
                      </>
                    )}
                  </button>

                  {completedSteps.length > 0 && (
                    <button
                      onClick={undoLastAction}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Undo Last Action</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Chat Input Bar */}
          <div className="glass-panel p-3 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Instruct agent (e.g. 'Refactor src/utils.ts' or 'Group tests into /tests')..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputMessage.trim()) {
                  addToast({
                    type: 'info',
                    title: 'Instruction Received',
                    message: `Agent is analyzing workspace for: "${inputMessage}"`,
                  });
                  setInputMessage('');
                }
              }}
            />
            <button
              onClick={() => {
                if (inputMessage.trim()) {
                  addToast({
                    type: 'info',
                    title: 'Instruction Received',
                    message: `Agent is analyzing workspace for: "${inputMessage}"`,
                  });
                  setInputMessage('');
                }
              }}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Column: Virtual File System Tree (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Workspace File Tree
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">/project</span>
            </div>

            {/* Tree Nodes */}
            <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto pr-1">
              
              <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200">
                <Folder className="w-4 h-4 text-indigo-500" />
                <span className="font-bold">/project</span>
              </div>

              {/* /docs folder */}
              <div className="pl-4 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800 ml-3">
                <div className="flex items-center justify-between py-1 px-2 rounded-md bg-slate-100/70 dark:bg-slate-800/70">
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">docs/</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">Auto-Created</span>
                </div>

                <div className="pl-4 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>README.md</span>
                    </div>
                    <span className="text-[10px] text-blue-500 font-semibold">Reversible</span>
                  </div>

                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>architecture.pdf</span>
                    </div>
                    <span className="text-[10px] text-blue-500 font-semibold">Reversible</span>
                  </div>
                </div>

                {/* Other Files */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-amber-500" />
                    <span>app.py</span>
                  </div>
                  <span className="text-[10px] text-slate-400">12.8 KB</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>config.json</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-semibold">Modified v2.4</span>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>final_report_v2.pdf</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-semibold">Renamed</span>
                </div>
              </div>

            </div>

            {/* Tree Footer note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Live Rollback Buffer Active
              </p>
              Every file change maintains an in-memory diff tree for zero-data-loss rollback.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
