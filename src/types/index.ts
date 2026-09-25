export type RiskLevel = 'low' | 'medium' | 'high';

export type ActionStatus = 
  | 'completed' 
  | 'rolling_back' 
  | 'undone' 
  | 'failed' 
  | 'pending_approval' 
  | 'in_progress';

export type ActionType = 
  | 'create_file'
  | 'move_file'
  | 'rename_file'
  | 'modify_file'
  | 'delete_file'
  | 'create_folder'
  | 'update_metadata'
  | 'api_call'
  | 'draft_email';

export interface AgentAction {
  id: string; // e.g. "ACT-92831"
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentRole: string;
  timestamp: string; // e.g. "10:43:02" or ISO
  timeAgo: string; // e.g. "2 minutes ago"
  type: ActionType;
  title: string;
  actionSummary: string;
  target: string;
  sourcePath?: string;
  destPath?: string;
  previousContent?: string;
  newContent?: string;
  previousStateDesc: string;
  newStateDesc: string;
  reason: string;
  risk: RiskLevel;
  status: ActionStatus;
  reversible: boolean;
  rollbackAvailable: boolean;
  impact: string;
  affectedFiles: string[];
  snapshotId?: string;
  tags?: string[];
  executionDurationMs?: number;
}

export interface FileChangeItem {
  path: string;
  type: 'added' | 'modified' | 'removed' | 'moved';
  oldPath?: string;
  newPath?: string;
  size?: string;
  details: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  status?: 'added' | 'modified' | 'removed' | 'moved' | 'unchanged';
  size?: string;
}

export interface Snapshot {
  id: string; // e.g. "SNAP-04"
  name: string; // "Snapshot #04"
  createdAt: string;
  relativeTime: string;
  actionsCount: number;
  filesChangedCount: number;
  status: string; // "Safe checkpoint"
  isCurrent: boolean;
  description: string;
  fileTreeBefore: FileNode[];
  fileTreeAfter: FileNode[];
  changes: FileChangeItem[];
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresApproval: boolean;
  category: 'file_ops' | 'communication' | 'finance' | 'system';
}

export interface AuditEntry {
  id: string;
  actionId: string;
  time: string;
  agent: string;
  action: string;
  resource: string;
  risk: RiskLevel;
  status: 'Completed' | 'Undone' | 'Pending' | 'Blocked';
  reversible: boolean;
  details: string;
  ipHash?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

export interface LiveAgentState {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'Working...' | 'Idle' | 'Awaiting Approval' | 'Rolling back' | 'Paused';
  currentTask: string;
  currentAction: string;
  progress: number;
  activeSince: string;
  currentActionId?: string;
}

export type ActiveTab = 
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'timeline'
  | 'undocenter'
  | 'snapshots'
  | 'policies'
  | 'auditlog'
  | 'settings';
