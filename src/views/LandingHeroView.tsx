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
  FileSpreadsheet,
  Bug,
  Server
} from 'lucide-react';

export const LandingHeroView: React.FC = () => {
  const { setActiveTab, runWorkflow, setIsTestMatrixOpen } = useAgent();

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern">
      
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full space-y-12">
        
        {/* Top Tag */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin-reverse" />
            <span>BUILDATHON 2026 AG02 • THE AGENT WITH AN UNDO BUTTON</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-slate-500 dark:text-slate-400">Saga-Style Transactional Engine</span>
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
            AI That Acts.{' '}
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              You Stay In Control.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
          >
            Transactional execution and recovery for tool-calling AI agents. Every action has a machine-readable compensation contract, durable logging, idempotency protection, and automatic reverse rollback.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400"
          >
            "Don't just execute AI actions. Make them recoverable."
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => {
                setActiveTab('workspace');
                runWorkflow('hotel_booking', 'FAIL_STEP_4');
              }}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Live Judge Demo</span>
            </button>

            <button
              onClick={() => setIsTestMatrixOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 glass-panel hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span>Test Matrix (27 Tests)</span>
            </button>
          </motion.div>
        </div>

        {/* 4 Pillars of Transactional Safety */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
        >
          <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Saga Compensation
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When step 4 fails, automatically executes C⁻¹ ➔ B⁻¹ ➔ A⁻¹ in reverse topological order.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Durable Execution Log
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Persistent state checkpoints survive server crashes, container restarts, and network cuts.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Idempotency Guard
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Guarantees zero duplicate side effects. Resumed workflows never charge cards or hold rooms twice.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Irreversible Guard
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Irreversible actions (emails, SMS) are placed last and locked behind explicit human authorization.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
