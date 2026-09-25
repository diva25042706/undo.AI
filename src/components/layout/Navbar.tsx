import React, { useState } from 'react';
import { useAgent } from '../../context/AgentContext';
import { 
  RotateCcw, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Bell, 
  Play, 
  Sparkles, 
  ShieldAlert,
  Menu,
  CheckCircle2
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    safeMode,
    setSafeMode,
    darkMode,
    setDarkMode,
    demoMode,
    setDemoMode,
    runHackathonDemo,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setActiveTab,
    toasts,
  } = useAgent();

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass-panel backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors lg:hidden"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5 transition-transform group-hover:-rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-slate-900 via-indigo-950 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  UNDO.AI
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/50">
                  AG02
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Agent Control Center title & status badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Agent Control Center</span>
          </div>

          {/* Safe Mode Badge */}
          <button
            onClick={() => setSafeMode((prev) => !prev)}
            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all shadow-xs ${
              safeMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 hover:bg-amber-100'
            }`}
            title="Click to toggle Safe Mode protection"
          >
            <span className={`w-2 h-2 rounded-full ${safeMode ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            {safeMode ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>{safeMode ? 'SAFE MODE ACTIVE' : 'UNRESTRICTED MODE'}</span>
          </button>
        </div>

        {/* Right Section: Actions, Demo, Notifications, Dark Mode, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Hackathon Demo Trigger */}
          <button
            onClick={runHackathonDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Launch 3-minute hackathon live storytelling demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-spin-reverse" />
            <span className="hidden sm:inline">Run Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Online Agent status pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Agent Online</span>
          </div>

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {toasts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-dropdown rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Live System Events</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                    {toasts.length} new
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {toasts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                  ) : (
                    toasts.map((t) => (
                      <div key={t.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Switcher */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                D
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                Demo
              </p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
