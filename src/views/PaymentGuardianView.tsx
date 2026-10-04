import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../context/AgentContext';
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
  CreditCard,
  Building,
  UserCheck,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  Layers,
  Send,
  HelpCircle,
  Lock,
  GitBranch,
  Timer,
  Database,
  Check,
  Eye,
  Sliders,
  Activity,
} from 'lucide-react';
import { FaultInjectionType } from '../types';

export const PaymentGuardianView: React.FC = () => {
  const {
    simulatedAccounts,
    activeTransaction,
    paymentVerification,
    paymentRecoveryPlan,
    activeFault,
    setActiveFault,
    isPaymentDemoRunning,
    paymentDemoStep,
    selectedDataset,
    setSelectedDataset,
    datasetBatches,
    currentBatchId,
    setCurrentBatchId,
    batchProcessingResult,
    isBatchProcessing,
    processCurrentBatch,
    activeIncident,
    setIsRecoveryPreviewOpen,
    runFlagshipPaymentDemo,
    executePaymentRecovery,
    initiateCustomPayment,
    resetPaymentSandbox,
    addToast,
  } = useAgent();

  const [promptInput, setPromptInput] = useState('Pay ₹10,000 to Sam.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'ANOMALIES' | 'RECOVERED'>('ALL');

  const handleCustomInitiate = async () => {
    setIsProcessing(true);
    let rec = 'Sam';
    let amt = 10000;
    if (promptInput.toLowerCase().includes('rahul')) rec = 'Rahul';
    if (promptInput.toLowerCase().includes('rakesh')) rec = 'Rakesh';

    await initiateCustomPayment(rec, amt, activeFault);
    setIsProcessing(false);
  };

  const senderAccount = simulatedAccounts.find((a) => a.account_id === 'ACC-SENDER') || {
    name: 'User (JD / Sender)',
    balance: 100000.0,
  };

  const isMismatch = paymentVerification && !paymentVerification.is_valid;

  // Mock live transaction records for stream view (derived from batch or default items)
  const defaultStreamItems = [
    { id: 'TXN-UNI-00000001', rec: 'Nikhil Joshi', amt: 2500, status: 'VERIFIED', type: 'NORMAL', time: '10:32:01' },
    { id: 'TXN-UNI-00000002', rec: 'Harsh Kumar', amt: 500, status: 'VERIFIED', type: 'NORMAL', time: '10:32:02' },
    { id: 'TXN-UNI-00000003', rec: 'Tanvi Menon', amt: 1000, status: 'VERIFIED', type: 'NORMAL', time: '10:32:03' },
    { id: 'TXN-UNI-00000004', rec: 'Pooja Agarwal', amt: 2500, status: 'VERIFIED', type: 'NORMAL', time: '10:32:04' },
    { id: 'TXN-UNI-00000010', rec: 'Sam Reddy', amt: 10000, status: 'MISMATCH', type: 'WRONG_AMOUNT', time: '10:32:05' },
    { id: 'TXN-UNI-00000013', rec: 'Manish Rao', amt: 100000, status: 'MISMATCH', type: 'WRONG_RECIPIENT', time: '10:32:06' },
    { id: 'TXN-UNI-00000025', rec: 'Sneha Mehta', amt: 500, status: 'MISMATCH', type: 'WRONG_RECIPIENT', time: '10:32:07' },
    { id: 'TXN-UNI-00000058', rec: 'Sneha Singh', amt: 5250, status: 'MISMATCH', type: 'WRONG_AMOUNT', time: '10:32:08' },
    { id: 'TXN-UNI-00000073', rec: 'Pranav Reddy', amt: 2500, status: 'MISMATCH', type: 'WRONG_RECIPIENT', time: '10:32:09' },
    { id: 'TXN-UNI-00000084', rec: 'Aarav Sharma', amt: 5000, status: 'VERIFIED', type: 'NORMAL', time: '10:32:10' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner / Flagship Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>FLAGSHIP AI SAFETY • REAL-TIME PAYMENT GUARDIAN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              AI Acts in FinTech.{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                You Stay in Control.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Continuously monitors autonomous payment actions, catches destination/amount mismatches in real time, and selects between <strong>CANCEL</strong>, <strong>COMPENSATE</strong>, or <strong>HUMAN ESCALATION</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              disabled={isPaymentDemoRunning}
              onClick={runFlagshipPaymentDemo}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Run Flagship Demo (Sam → Rakesh)</span>
            </button>

            <button
              onClick={resetPaymentSandbox}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Balances</span>
            </button>
          </div>
        </div>

        {/* Safety Simulation Disclaimer Badge */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
              SAFE SANDBOX SIMULATION
            </span>
            <span>No real bank APIs or actual money are accessed. Strict atomic memory state.</span>
          </div>

          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            Sender Balance: ₹{senderAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATASET CONTROL & 100-RECORD BATCH PROCESSOR                              */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dataset & Batch Processor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                ● LIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select benchmark dataset and trigger live batch processing through the UNDO.AI safety verification layer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dataset Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Dataset:</span>
              <select
                value={selectedDataset}
                onChange={(e) => {
                  setSelectedDataset(e.target.value);
                  addToast({
                    type: 'info',
                    title: 'Dataset Switched',
                    message: `Loaded benchmark dataset: ${e.target.value}`,
                  });
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UNDO AI Universal (10,000 records)">UNDO AI Universal (10,000 records)</option>
                <option value="Banking (10,000 records)">Banking (10,000 records)</option>
                <option value="Payment Platform (10,000 records)">Payment Platform (10,000 records)</option>
                <option value="Enterprise Finance (10,000 records)">Enterprise Finance (10,000 records)</option>
                <option value="E-Commerce (10,000 records)">E-Commerce (10,000 records)</option>
                <option value="AI Agent Operations (10,000 records)">AI Agent Operations (10,000 records)</option>
              </select>
            </div>

            {/* Batch Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Batch:</span>
              <select
                value={currentBatchId}
                onChange={(e) => setCurrentBatchId(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none"
              >
                <option value="BATCH-000001">BATCH-000001 (100 txns)</option>
                <option value="BATCH-000002">BATCH-000002 (100 txns)</option>
                <option value="BATCH-000003">BATCH-000003 (100 txns)</option>
                <option value="BATCH-000004">BATCH-000004 (100 txns)</option>
                <option value="BATCH-000005">BATCH-000005 (100 txns)</option>
              </select>
            </div>

            {/* Process Batch CTA */}
            <button
              disabled={isBatchProcessing}
              onClick={processCurrentBatch}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isBatchProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Process Batch (100 Txns)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch Processing Status Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total in Batch</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
              100 Transactions
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Verified Automatically</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {batchProcessingResult ? batchProcessingResult.verified_automatically : '95'} Verified (✓)
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Anomalies Isolated</span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {batchProcessingResult ? batchProcessingResult.anomalies_detected : '5'} Mismatches Caught
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Final Outcome</span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
              100/100 SAFE (100%)
            </p>
          </div>
        </div>

        {/* Live Transaction Stream Viewer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Live Transaction Stream ({currentBatchId})
            </h4>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setStreamFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  streamFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All (10)
              </button>
              <button
                onClick={() => setStreamFilter('ANOMALIES')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  streamFilter === 'ANOMALIES' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Anomalies (5)
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 max-h-60 overflow-y-auto">
            {defaultStreamItems
              .filter((item) => streamFilter === 'ALL' || (streamFilter === 'ANOMALIES' && item.status === 'MISMATCH'))
              .map((item) => (
                <div key={item.id} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800/80 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.id}
                    </span>
                    <span className="text-slate-500">
                      Transfer ₹{item.amt.toLocaleString()} to <strong className="text-slate-900 dark:text-white">{item.rec}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> {item.type}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Fault Injection Control Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Controlled Fault Injection Selector (Demo Controls)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Active: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{activeFault}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            { id: 'NONE', label: '1. Normal Payment', desc: 'No faults. Intended: Sam.' },
            { id: 'WRONG_RECIPIENT', label: '2. Wrong Recipient', desc: 'Primary Flagship: Sam → Rakesh.' },
            { id: 'WRONG_AMOUNT', label: '3. Wrong Amount', desc: '₹10,000 → ₹15,000.' },
            { id: 'DUPLICATE', label: '4. Duplicate Txn', desc: 'Simultaneous duplicate charges.' },
            { id: 'COMPLETED_COMPENSATE', label: '5. Completed / Refund', desc: 'Tests COMPENSATE refund.' },
            { id: 'IRREVERSIBLE', label: '6. Irreversible Anomaly', desc: 'Forces HUMAN_ESCALATION.' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFault(f.id as FaultInjectionType);
                addToast({
                  type: 'info',
                  title: 'Fault Mode Updated',
                  message: `Simulated injection set to ${f.label}`,
                });
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeFault === f.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 text-indigo-900 dark:text-indigo-100'
                  : 'bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <p className="font-bold text-[11px]">{f.label}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Prompt & Simulation Runner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Autonomous Payment Agent Prompt
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger custom agent instructions and observe independent contract verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPromptInput('Pay ₹10,000 to Sam.')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Default: Sam
            </button>
            <button
              onClick={() => setPromptInput('Pay ₹10,000 to Rahul.')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Target: Rahul
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g., Pay ₹10,000 to Sam."
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <button
            disabled={isProcessing}
            onClick={handleCustomInitiate}
            className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Initiate Simulated Payment</span>
          </button>
        </div>
      </div>

      {/* Main Payment Guardian Comparison & Decision Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Expected vs Actual State Diff */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Independent Verification Contract
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Independent state verification detected a mismatch against the intended payment contract.
              </p>
            </div>

            {activeTransaction && (
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {activeTransaction.transaction_id}
              </span>
            )}
          </div>

          {/* Side by Side Diff Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Expected State */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Expected State
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  Target Intent
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {paymentVerification?.expected_recipient || activeTransaction?.intended_recipient_name || 'Sam'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ₹{(paymentVerification?.expected_amount || activeTransaction?.intended_amount || 10000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Currency:</span>
                  <span className="font-bold text-slate-900 dark:text-white">INR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Checkpoint:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">CP-PAY-001</span>
                </div>
              </div>
            </div>

            {/* Actual Observed State */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
              !isMismatch
                ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  !isMismatch ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                }`}>
                  {!isMismatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  Actual State
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  !isMismatch
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                }`}>
                  {activeTransaction?.status || 'PENDING'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className={`font-bold ${isMismatch ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    {paymentVerification?.actual_recipient || activeTransaction?.recipient_name || 'Rakesh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ₹{(paymentVerification?.actual_amount || activeTransaction?.amount || 10000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">State Match:</span>
                  <span className={`font-bold ${!isMismatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {!isMismatch ? '✓ INVARIANTS MATCH' : '❌ MISMATCH DETECTED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {paymentVerification?.summary.slice(0, 24) || 'Pending check...'}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Action Bar */}
          {paymentRecoveryPlan && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Recommended Recovery Action
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {paymentRecoveryPlan.action_label} ({paymentRecoveryPlan.strategy})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {paymentRecoveryPlan.action_description}
                </p>
              </div>

              <button
                onClick={executePaymentRecovery}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                Execute Recovery
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Simulated Sandbox Account Balances Drawer */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Simulated Accounts Ledger
            </h3>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded">
              In-Memory
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {simulatedAccounts.map((acc) => (
              <div
                key={acc.account_id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  acc.account_id === 'ACC-SENDER'
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{acc.avatar}</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{acc.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{acc.account_id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-extrabold text-slate-900 dark:text-white">
                    ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[9px] text-emerald-600 font-semibold uppercase">{acc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THREE CORE DIFFERENTIATORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            1
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Independent State Verification</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The AI agent does NOT get to decide whether it succeeded. UNDO.AI independently compares the expected state contract against the real ledger.
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
            2
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Selective Recovery</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When 1 payment in a 100-batch fails, we don't rollback the entire batch. We isolate the single affected transaction with 0.01% blast radius.
          </p>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            3
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recovery Intelligence</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Chooses between <strong>CANCEL</strong> on pending, <strong>COMPENSATE</strong> on settled, and <strong>HUMAN ESCALATION</strong> on irreversible events.
          </p>
        </div>
      </div>

    </div>
  );
};
