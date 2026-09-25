import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Command,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FileCode,
  CheckCircle2,
  Sliders,
  Database,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    safeMode,
    setSafeMode,
    demoMode,
    setDemoMode,
    resetToDefault,
    addToast,
  } = useAgent();

  const [snapshotRetention, setSnapshotRetention] = useState('50');
  const [dryRunMode, setDryRunMode] = useState(false);
  const [autoRollbackOnError, setAutoRollbackOnError] = useState(true);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const howItWorksSteps = [
    {
      step: 1,
      title: '1. Agent Plans',
      desc: 'The autonomous agent evaluates workspace goals and generates an atomic execution graph with categorized risk levels.',
      icon: Cpu,
    },
    {
      step: 2,
      title: '2. User Reviews',
      desc: 'High-impact or irreversible actions trigger approval gates, while safe actions are flagged for autonomous execution.',
      icon: ShieldCheck,
    },
    {
      step: 3,
      title: '3. Agent Executes',
      desc: 'Agent performs file moves, refactors, and updates in sandboxed buffers with sub-second execution speeds.',
      icon: Sparkles,
    },
    {
      step: 4,
      title: '4. System Checkpoint',
      desc: 'Before every atomic mutation, the Undo Engine saves memory diff snapshots into an indexed state buffer.',
      icon: Layers,
    },
    {
      step: 5,
      title: '5. User Can Undo',
      desc: 'Clicking “Undo” or pressing Ctrl+Z instantly computes the inverse diff and prepares zero-data-loss rollback.',
      icon: RotateCcw,
    },
    {
      step: 6,
      title: '6. State Restored',
      desc: 'The previous file tree, schema versions, and folder structures are seamlessly restored to original states.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <SettingsIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Engine Configuration & Documentation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the UNDO.AI engine parameters, keyboard shortcuts, and inspect the core reversibility architecture.
          </p>
        </div>

        <button
          onClick={resetToDefault}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo State</span>
        </button>
      </div>

      {/* HOW IT WORKS SECTION (README-Style 6-Step Guide) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6 bg-linear-to-b from-white via-indigo-50/10 to-white dark:from-slate-900 dark:via-indigo-950/10 dark:to-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How the Undo Engine Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The 6-step lifecycle that guarantees autonomous safety and state reversibility.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
            SPEC AG02
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {howItWorksSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Command className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Command Center & Keyboard Shortcuts
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Agent Rollback
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              {isMac ? '⌘' : 'Ctrl'} + Z
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Dismiss Modals
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              Esc
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              Confirm Action
            </span>
            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold shadow-xs">
              Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* Engine Tuning Parameters */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Rollback Engine Parameters
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Max Undo History Depth</p>
              <p className="text-[11px] text-slate-500">Number of atomic actions retained in memory before archival.</p>
            </div>
            <select
              value={snapshotRetention}
              onChange={(e) => setSnapshotRetention(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold focus:outline-hidden"
            >
              <option value="25">25 actions</option>
              <option value="50">50 actions</option>
              <option value="100">100 actions</option>
              <option value="unlimited">Unlimited (Enterprise)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Auto-Rollback on Verification Failure</p>
              <p className="text-[11px] text-slate-500">Automatically reverse actions if downstream syntax or build tests fail.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRollbackOnError}
                onChange={(e) => setAutoRollbackOnError(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Dry-Run Simulation Mode</p>
              <p className="text-[11px] text-slate-500">Simulate all state changes in a sandbox before committing files.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dryRunMode}
                onChange={(e) => setDryRunMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

        </div>
      </div>

    </div>
  );
};
