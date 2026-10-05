import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { CHENNAI_AREAS, WORKFLOW_DEFINITIONS, WorkflowType } from '../engine/workflows';
import { 
  Database, 
  Search, 
  Download, 
  Filter, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileSpreadsheet, 
  MapPin, 
  Layers, 
  ExternalLink,
  Lock,
  Sparkles,
  Zap,
  PowerOff,
  Flame,
  AlertTriangle,
} from 'lucide-react';

// Load the 20 canonical judge demo records and sample live demo records
import sampleJudgeDemo from '../../data/chennai_demo_20.json';
import sampleLiveDemo from '../../data/chennai_demo_100.json';

export const ChennaiDatasetView: React.FC = () => {
  const { runWorkflow, selectWorkflow, setFaultInjection, setActiveTab, addToast } = useAgent();

  const [selectedDatasetTab, setSelectedDatasetTab] = useState<'demo20' | 'demo100' | 'master100k'>('demo20');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedWfType, setSelectedWfType] = useState('ALL');
  const [selectedFaultFilter, setSelectedFaultFilter] = useState('ALL');

  const currentDataset = selectedDatasetTab === 'demo20' ? sampleJudgeDemo : sampleLiveDemo;

  const filteredRecords = currentDataset.filter((r) => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workflow_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.action.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedArea !== 'ALL' && r.area !== selectedArea) return false;
    if (selectedWfType !== 'ALL' && r.workflow_type !== selectedWfType) return false;
    if (selectedFaultFilter !== 'ALL' && r.fault_type !== selectedFaultFilter) return false;

    return true;
  });

  const handleExecuteFromRecord = async (record: typeof currentDataset[0]) => {
    const wfType = record.workflow_type as WorkflowType;
    selectWorkflow(wfType);
    
    let fault: any = 'NONE';
    if (record.fault_type === 'STEP_FAILURE' || record.fault_type === 'TIMEOUT' || record.fault_type === 'NETWORK_FAILURE') {
      fault = `FAIL_STEP_${record.fault_position || 4}`;
    } else if (record.fault_type === 'CRASH') {
      fault = `CRASH_AFTER_STEP_${record.crash_after_step || 2}`;
    } else if (record.fault_type === 'COMPENSATION_FAILURE') {
      fault = 'FAIL_COMPENSATION';
    }

    setFaultInjection(fault);
    setActiveTab('workspace');
    addToast({
      type: 'info',
      title: 'Workflow Loaded from Dataset',
      message: `Loaded ${record.workflow_id} (${record.area}) into Saga Workspace.`,
    });
    await runWorkflow(wfType, fault);
  };

  const handleDownloadFile = (filename: string) => {
    addToast({
      type: 'success',
      title: 'Dataset Download Ready',
      message: `Downloaded /data/${filename} (${filename.includes('100k') ? '100,000 master records' : 'benchmark dataset'}).`,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>SYNTHETIC CHENNAI WORKFLOW DATASET • BUILDATHON AG02</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Chennai Workflow Benchmark & Verification Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              100,000 synthetic multi-step agent actions covering 36 Chennai areas and 8 real-world domains. Every record specifies machine-readable compensation contracts, idempotency keys, and verified final states.
            </p>
          </div>

          {/* Quick File Downloads */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/data/chennai_demo_20.csv"
              download="chennai_demo_20.csv"
              onClick={() => handleDownloadFile('chennai_demo_20.csv')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Judge Demo (20 WFs)</span>
            </a>

            <a
              href="/data/chennai_demo_100.csv"
              download="chennai_demo_100.csv"
              onClick={() => handleDownloadFile('chennai_demo_100.csv')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Live Demo (100 WFs)</span>
            </a>

            <a
              href="/data/chennai_workflows_100k.csv"
              download="chennai_workflows_100k.csv"
              onClick={() => handleDownloadFile('chennai_workflows_100k.csv')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Master Dataset (100,000 Records)</span>
            </a>
          </div>
        </div>

        {/* Dataset Stats Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Master Records</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-base">
              100,000 Step Records
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Chennai Geographic Zones</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
              36 Real Chennai Areas
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Multi-Step Domains</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400 text-base">
              8 Real-World Workflows
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tool Compensation Contracts</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
              40 Machine Contracts
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Fault Injection Matrix</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
              12 Failure Classes
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Filter & Query Controls */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Dataset Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
            <button
              onClick={() => setSelectedDatasetTab('demo20')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDatasetTab === 'demo20'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Judge Demo (20 Scenarios)
            </button>
            <button
              onClick={() => setSelectedDatasetTab('demo100')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDatasetTab === 'demo100'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Live Demo (100 Scenarios)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, area, tool, ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Dropdowns Row: Area, Workflow Type, Fault Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Filter by Chennai Area (36 Zones)
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Chennai Areas (36 Areas)</option>
              {CHENNAI_AREAS.map((a) => (
                <option key={a} value={a}>
                  📍 {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Filter by Workflow Domain (8 Workflows)
            </label>
            <select
              value={selectedWfType}
              onChange={(e) => setSelectedWfType(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="ALL">All 8 Workflows</option>
              {Object.values(WORKFLOW_DEFINITIONS).map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.avatar} {wf.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Filter by Fault Injection Class
            </label>
            <select
              value={selectedFaultFilter}
              onChange={(e) => setSelectedFaultFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Fault Types (12 Classes)</option>
              <option value="NORMAL">✓ NORMAL (Happy Path)</option>
              <option value="STEP_FAILURE">⚠ STEP_FAILURE</option>
              <option value="TIMEOUT">⏱ TIMEOUT</option>
              <option value="DUPLICATE_REQUEST">🔁 DUPLICATE_REQUEST</option>
              <option value="UNKNOWN_STATE">❓ UNKNOWN_STATE</option>
              <option value="CRASH">⚡ CRASH</option>
              <option value="COMPENSATION_FAILURE">🔥 COMPENSATION_FAILURE</option>
              <option value="IRREVERSIBLE_ACTION">🔒 IRREVERSIBLE_ACTION</option>
              <option value="PARTIAL_FAILURE">⚠️ PARTIAL_FAILURE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Records Table */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Synthetic Workflow Records ({filteredRecords.length} Filtered Results)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Location: Chennai, Tamil Nadu • Schema: Master Buildathon v2.0
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Workflow ID</th>
                <th className="p-3">Chennai Area</th>
                <th className="p-3">Synthetic Customer</th>
                <th className="p-3">Step & Action</th>
                <th className="p-3">Compensation Contract</th>
                <th className="p-3">Fault Injection</th>
                <th className="p-3">World Invariant</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRecords.map((rec) => {
                const isCompensated = rec.compensation_status === 'COMPENSATED';
                const isFailed = rec.execution_status === 'FAILED';
                const isCompFailed = rec.compensation_status === 'COMPENSATION_FAILED';
                const isApproval = rec.requires_approval;

                return (
                  <tr
                    key={rec.record_id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <div>{rec.workflow_id}</div>
                      <div className="text-[9px] text-slate-400 font-normal">step {rec.step_number}/{rec.total_steps}</div>
                    </td>

                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{rec.area}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                        {rec.business_name}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{rec.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rec.synthetic_phone}</div>
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white">{rec.action}()</div>
                      <div className="text-[10px] text-slate-400">tool: {rec.tool_name}</div>
                    </td>

                    <td className="p-3 text-[11px]">
                      {rec.compensation_action ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          <RotateCcw className="w-3 h-3" />
                          <span>{rec.compensation_action}()</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 italic">
                          <Lock className="w-3 h-3" />
                          <span>None (Irreversible)</span>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400">
                        {rec.reversible ? 'Reversible ✓' : 'Irreversible'} • {rec.idempotent ? 'Idempotent' : ''}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.fault_type === 'NORMAL'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : rec.fault_type === 'CRASH'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : rec.fault_type === 'COMPENSATION_FAILURE'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {rec.fault_type}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`font-bold text-[11px] ${
                          rec.final_world_state === 'RESTORED' || rec.final_world_state === 'RESTORED_OR_COMMITTED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {rec.final_world_state}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleExecuteFromRecord(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                        title="Load and execute this workflow in the Saga Engine"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
