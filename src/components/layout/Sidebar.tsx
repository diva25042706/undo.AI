import React from 'react';
import { useAgent } from '../../context/AgentContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  Bot,
  History,
  RotateCcw,
  Camera,
  ShieldAlert,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  HelpCircle,
  ExternalLink,
  Database,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    stats,
    demoMode,
    setDemoMode,
  } = useAgent();

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workspace', label: 'Agent Workspace', icon: Bot, badge: 'Live', badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { id: 'chennaidataset', label: 'Chennai Dataset', icon: Database, badge: '100k', badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold' },
    { id: 'timeline', label: 'Action Timeline', icon: History },
    { 
      id: 'undocenter', 
      label: 'Recovery Center', 
      icon: RotateCcw, 
      badge: 'Saga DAG', 
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold' 
    },
    { id: 'payment', label: 'Payment Guardian', icon: Zap, badge: 'Sim', badgeColor: 'bg-slate-500/20 text-slate-600 dark:text-slate-400' },
    { id: 'snapshots', label: 'Snapshots', icon: Camera, badge: 'Checkpoints' },
    { id: 'policies', label: 'Agent Policies', icon: ShieldAlert },
    { id: 'auditlog', label: 'Audit Log', icon: FileText },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Nav Links */}
      <div className="p-3 space-y-1 overflow-y-auto">
        
        {/* Navigation Group Header */}
        {!isSidebarCollapsed && (
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                />
                {item.id === 'undocenter' && stats.safeToUndoCount > 0 && isSidebarCollapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </div>

              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Demo Mode Toggle Card in Sidebar */}
        {!isSidebarCollapsed && (
          <div className="mt-4 p-3 rounded-xl bg-linear-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100/80 dark:border-indigo-900/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Live Demo Mode
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Auto-triggers background agent tasks to demo live rollback streams.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Area: Settings, Help, Sidebar Collapse */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Settings & System Overview"
        >
          <Settings className="w-4 h-4" />
          {!isSidebarCollapsed && <span>Settings & Engine</span>}
        </button>

        {/* Collapse toggle button */}
        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
