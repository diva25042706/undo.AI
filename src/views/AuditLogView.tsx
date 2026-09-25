import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, actions, setSelectedActionForDetails, addToast } = useAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedAgent !== 'all' && log.agent !== selectedAgent) return false;
    if (selectedRisk !== 'all' && log.risk !== selectedRisk) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;

    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Action ID', 'Timestamp', 'Agent', 'Action', 'Resource', 'Risk', 'Status', 'Reversible', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.actionId,
      l.time,
      `"${l.agent}"`,
      `"${l.action}"`,
      `"${l.resource}"`,
      l.risk,
      l.status,
      l.reversible ? 'YES' : 'NO',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UNDO_AI_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Audit Log Exported',
      message: `${filteredLogs.length} audit entries exported as CSV file.`,
    });
  };

  const handleRowClick = (actionId: string) => {
    const matched = actions.find((a) => a.id === actionId);
    if (matched) {
      setSelectedActionForDetails(matched);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Immutable Compliance Record</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Audit Log & Action Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cryptographically sealed timeline of all automated agent operations, state transformations, and user rollbacks.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Export CSV / JSON</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, resource, agent, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Agent Filter */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Agents</option>
            <option value="Workspace Agent">Workspace Agent</option>
            <option value="Cleanup Agent">Cleanup Agent</option>
            <option value="Security & Audit Agent">Security Agent</option>
            <option value="Undo Engine / Safety Guard">Undo Engine</option>
          </select>

          {/* Risk Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Undone">Undone (Rolled Back)</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">TIME</th>
                <th className="px-4 py-3.5">AGENT</th>
                <th className="px-4 py-3.5">ACTION</th>
                <th className="px-4 py-3.5">RESOURCE</th>
                <th className="px-4 py-3.5">RISK</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5">REVERSIBLE</th>
                <th className="px-5 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-sans">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleRowClick(log.actionId)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {log.time}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {log.agent}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-sans text-slate-900 dark:text-white font-medium">
                      {log.action}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {log.resource}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <RiskBadge risk={log.risk} size="sm" showTooltip={false} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-sans">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          log.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.status === 'Undone'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {log.status === 'Undone' && <RotateCcw className="w-3 h-3" />}
                        {log.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={log.reversible ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                        {log.reversible ? 'YES' : 'NO'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-sans">
                      <button className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-1 ml-auto">
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
