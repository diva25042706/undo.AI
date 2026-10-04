import React from 'react';
import { ActionStatus } from '../../types';
import { CheckCircle2, RotateCcw, XCircle, Clock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: ActionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
          spin: false,
        };
      case 'rolling_back':
      case 'recovering':
        return {
          label: status === 'recovering' ? 'Recovering...' : 'Rolling Back...',
          icon: Loader2,
          classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
          spin: true,
        };
      case 'undone':
      case 'recovered':
        return {
          label: status === 'recovered' ? 'Recovered' : 'Undone',
          icon: RotateCcw,
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50',
          spin: false,
        };
      case 'failed':
        return {
          label: 'Rollback Failed',
          icon: XCircle,
          classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
          spin: false,
        };
      case 'pending_approval':
        return {
          label: 'Pending Approval',
          icon: AlertCircle,
          classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50',
          spin: false,
        };
      case 'in_progress':
      default:
        return {
          label: 'In Progress',
          icon: Clock,
          classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50',
          spin: true,
        };
    }
  };

  const { label, icon: Icon, classes, spin } = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight transition-all ${classes} ${sizeClasses}`}
    >
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${spin ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </span>
  );
};
