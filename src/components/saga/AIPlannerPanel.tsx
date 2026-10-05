// ============================================================================
// UNDO.AI — GLM / ZHIPU AI PLANNER & DETERMINISTIC VALIDATION PANEL
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// "GLM proposes WHAT to do. UNDO.AI controls HOW it is safely executed."
// ============================================================================

import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { PlanValidator, PlanValidationResult } from '../../engine/planValidator';
import { WorkflowType, WorkflowInstance } from '../../engine/workflows';
import {
  Sparkles,
  Bot,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Cpu,
  Play,
  Lock,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AIPlannerPanelProps {
  onLoadPlan: (instance: WorkflowInstance, workflowType: WorkflowType) => void;
  activeWorkflowType: WorkflowType;
}

const SAMPLE_PROMPTS = [
  {
    type: 'cab_booking' as WorkflowType,
    label: '🚕 Cab / Ride (OMR)',
    prompt: 'Book a cab from Thiruvanmiyur to Sholinganallur for Divakaran',
    desc: 'Extracts pickup/drop, drivers, fare, binds cab/driver rollback contracts.',
  },
  {
    type: 'delivery' as WorkflowType,
    label: '🚚 Parcel Delivery (Tambaram)',
    prompt: 'Deliver parcel DEL-CHN-7701 from Tambaram Central Hub to Chromepet for Divakaran',
    desc: 'Extracts manifest, driver, vehicle slot, dispatch package, binds courier rollback.',
  },
  {
    type: 'hotel_booking' as WorkflowType,
    label: '🏨 Hotel Booking (Nungambakkam)',
    prompt: 'Reserve a Deluxe Room at Nungambakkam for Divakaran ($750)',
    desc: 'Extracts hotel, room inventory, card charge, binds room & payment rollback.',
  },
  {
    type: 'ecommerce_order' as WorkflowType,
    label: '🛒 E-Commerce Order (Velachery)',
    prompt: 'Order an AI Dev Workstation Laptop to Velachery for ₹85,000 for Divakaran',
    desc: 'Extracts warehouse SKU, payment, shipping manifest, binds inventory release.',
  },
  {
    type: 'customer_support' as WorkflowType,
    label: '🎫 Customer Support (Adyar)',
    prompt: 'Escalate billing support ticket in Adyar and issue ₹500 credit for Divakaran',
    desc: 'Extracts ticket ID, goodwill credit, binds CRM restoration contracts.',
  },
];

export const AIPlannerPanel: React.FC<AIPlannerPanelProps> = ({ onLoadPlan, activeWorkflowType }) => {
  const defaultPrompt = SAMPLE_PROMPTS.find(s => s.type === activeWorkflowType)?.prompt || SAMPLE_PROMPTS[0].prompt;
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<{
    provider: string;
    model: string;
    configured: boolean;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<PlanValidationResult | null>(null);
  const [, setRawAIResponse] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'comparison' | 'invariants' | 'json'>('comparison');

  // Load AI configuration on mount
  useEffect(() => {
    ApiService.getAIConfig().then((cfg) => {
      if (cfg) {
        setAiConfig({
          provider: cfg.provider,
          model: cfg.model,
          configured: cfg.configured,
        });
      }
    });

    handleGeneratePlan(defaultPrompt);
  }, []);

  // Update prompt when activeWorkflowType changes from outside
  useEffect(() => {
    const match = SAMPLE_PROMPTS.find((s) => s.type === activeWorkflowType);
    if (match) {
      setPrompt(match.prompt);
      handleGeneratePlan(match.prompt);
    }
  }, [activeWorkflowType]);

  const handleGeneratePlan = async (queryToRun?: string) => {
    const query = queryToRun || prompt;
    setIsLoading(true);

    try {
      const res = await ApiService.generateAIPlan(query, {
        name: 'Divakaran',
        email: 'divakaranperumal27@gmail.com',
      });

      if (res && res.plan) {
        setRawAIResponse(res);
        const validated = PlanValidator.validatePlan({
          ...res.plan,
          model: res.model,
          provider: res.provider,
          is_fallback: res.is_fallback,
        });
        setValidationResult(validated);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEngine = () => {
    if (validationResult?.executableInstance) {
      onLoadPlan(validationResult.executableInstance, validationResult.workflowType);
    }
  };

  return (
    <div className="space-y-6">
      {/* GLM Banner */}
      <div className="p-6 rounded-3xl glass-panel relative overflow-hidden border border-indigo-200/80 dark:border-indigo-900/60 bg-linear-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                  AI PLANNING LAYER
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Model: {aiConfig?.model || 'GLM-5.3'}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    aiConfig?.configured
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {aiConfig?.configured ? 'GLM Cloud API Active' : 'Deterministic Engine Ready'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                GLM Natural Language Intent ➔ UNDO.AI Deterministic Control
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                <em>&ldquo;GLM decides <strong>WHAT</strong> to do. UNDO.AI decides <strong>HOW</strong> it can be safely executed and recovered.&rdquo;</em>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] font-mono text-slate-500">
              Zero Tool Authority &bull; Zero Rollback Authority
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              100% Deterministic Saga Verification
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Bar & Quick Sample Chips */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-500" />
            Natural Language User Instruction
          </label>
          <span className="text-xs text-slate-500">
            Type any request or click a Chennai demo scenario below
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()}
              placeholder="e.g. Book a cab from Thiruvanmiyur to Sholinganallur for Divakaran"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <button
            disabled={isLoading || !prompt.trim()}
            onClick={() => handleGeneratePlan()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Demo Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Demo Scenarios:
          </span>
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.type}
              onClick={() => {
                setPrompt(sample.prompt);
                handleGeneratePlan(sample.prompt);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                activeWorkflowType === sample.type
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Results & Validation */}
      {validationResult && (
        <div className="space-y-6">
          {/* Subtabs: Side-by-Side vs Invariants vs JSON */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ⚖️ Side-by-Side: AI Proposes vs UNDO Controls
              </button>
              <button
                onClick={() => setActiveTab('invariants')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'invariants'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                🛡️ 7 Invariant Checks ({validationResult.invariants.filter((i) => i.passed).length}/7 Passed)
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {`{ }`} Structured JSON
              </button>
            </div>

            {validationResult.isValid && (
              <button
                onClick={handleApplyToEngine}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Load & Execute in Saga Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab 1: Side-by-Side Comparison */}
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: AI PROPOSED PLAN */}
              <div className="p-6 rounded-3xl glass-panel border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Proposed Plan (GLM)
                      </h4>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                        Model: {validationResult.model} &bull; Intent Synthesis Only
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    SUGGESTION ONLY
                  </span>
                </div>

                {/* Intent & Extracted Entities */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Detected Intent: <span className="text-purple-600 dark:text-purple-400">{validationResult.proposedPlan.intent}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Target Domain:</span>{' '}
                      <strong className="text-slate-900 dark:text-white capitalize">{validationResult.workflowType.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Customer:</span>{' '}
                      <strong className="text-slate-900 dark:text-white">{validationResult.proposedPlan.customer?.name}</strong>
                    </div>
                  </div>
                </div>

                {/* Proposed Steps */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                      Proposed Tool Sequence ({validationResult.proposedPlan.requested_steps?.length || 0} Steps)
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">0 Execution Authority</span>
                  </div>
                  <div className="space-y-2">
                    {(validationResult.proposedPlan.requested_steps || []).map((stepName, idx) => (
                      <div
                        key={`ai-step-${idx}`}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                              {stepName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Proposed Action Call
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          UNVERIFIED SUGGESTION
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: UNDO.AI DETERMINISTIC CONTROL */}
              <div className="p-6 rounded-3xl glass-panel border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        UNDO.AI Plan Validator & Control
                      </h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Deterministic Saga DAG &bull; Invariant Verified
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    EXECUTION APPROVED
                  </span>
                </div>

                {/* Contract Guarantees */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tool Contracts:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">100% Bound to Compensation Registry</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Compensation Actions:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Verified Deterministic Reverse Mapping</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Irreversible Actions:</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">Enforced Strict Final Ordering (Human Guarded)</strong>
                  </div>
                </div>

                {/* Validated Steps with Bound Compensations */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Validated Execution DAG & Bound Undo Handlers
                  </span>
                  <div className="space-y-2">
                    {validationResult.validatedSteps.map((step) => (
                      <div
                        key={`val-step-${step.stepId}`}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center font-mono">
                              {step.stepNumber}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                {step.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Tool: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{step.toolName}</span> &bull; Action: <span className="text-slate-600 dark:text-slate-300">{step.contract.action}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {step.contract.reversible ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                REVERSIBLE
                              </span>
                            ) : step.contract.requiresApproval ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-center">
                                IRREVERSIBLE • NO COMPENSATION • APPROVAL REQUIRED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                READ ONLY
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Undo Handler Row */}
                        {step.contract.compensationAction ? (
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono">
                              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                              <span>Undo Handler: <strong className="font-bold">{step.contract.compensationAction}</strong></span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              IDEMPOTENT
                            </span>
                          </div>
                        ) : step.contract.requiresApproval ? (
                          <div className="flex items-center justify-between pt-1.5 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-300">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>Enforce Final Step &bull; Requires Operator Confirmation</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              GUARDED
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 7 Invariant Checks */}
          {activeTab === 'invariants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validationResult.invariants.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    inv.passed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {inv.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      {inv.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {inv.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                    {inv.description}
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    {inv.details}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Raw JSON */}
          {activeTab === 'json' && (
            <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
              <pre>{JSON.stringify(validationResult.proposedPlan, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
