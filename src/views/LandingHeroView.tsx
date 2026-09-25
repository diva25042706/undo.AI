import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import { 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Zap,
  Lock,
  Play,
  Terminal,
  Activity,
  FileCheck
} from 'lucide-react';

export const LandingHeroView: React.FC = () => {
  const { setActiveTab, runHackathonDemo } = useAgent();

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern">
      
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full space-y-12">
        
        {/* Top Product Tag */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin-reverse" />
            <span>AG02 — Autonomous Agent Safety Architecture</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-slate-500 dark:text-slate-400">Zero-Risk Delegation</span>
          </motion.div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
          >
            AI that acts.{' '}
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Actions you can undo.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
          >
            Give autonomous agents the freedom to organize files, refactor code, and execute workflows — without giving up control. Every change is traceable, checkpointed, and 100% reversible.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={runHackathonDemo}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Live Demo</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 glass-panel hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </motion.div>
        </div>

        {/* Hero Visual: Animated Flow Timeline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 sm:p-8 rounded-3xl glass-panel shadow-2xl relative overflow-hidden border border-slate-200/90 dark:border-slate-800"
        >
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">undo-engine-pipeline.trace</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Protected by Undo Engine (Sub-second Rollbacks)</span>
            </div>
          </div>

          {/* Interactive Pipeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
            
            {/* Step 1: Action */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-indigo-400 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Agent Action</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Agent executes multi-step tasks across files.</p>
            </div>

            {/* Step 2: Checkpoint */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-indigo-400 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto Checkpoint</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Instant snapshot buffer created before state change.</p>
            </div>

            {/* Step 3: Human Gate */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-indigo-400 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Policy Gate</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Irreversible actions halted for explicit confirmation.</p>
            </div>

            {/* Step 4: Undo */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 shadow-md space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <RotateCcw className="w-4 h-4 animate-spin-reverse" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Step 4</span>
              <h4 className="text-xs font-bold text-indigo-950 dark:text-white">1-Click Undo</h4>
              <p className="text-[11px] text-indigo-900/80 dark:text-indigo-200/80 leading-tight">Hit Ctrl+Z or Undo Button to reverse in ~1.2s.</p>
            </div>

            {/* Step 5: Restored */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 shadow-md space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Step 5</span>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-white">State Restored</h4>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 leading-tight">Files, schemas, and trees perfectly recovered.</p>
            </div>

          </div>

          {/* Quick Stats Strip */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">98.4%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Undo Success Rate</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">1.2s</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Avg Rollback Speed</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">100%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Logged & Audited</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">0 Data Loss</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Guaranteed Buffer</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
