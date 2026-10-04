import type { AgentAction, Snapshot, PolicyRule, AuditEntry, LiveAgentState, FileNode } from '../types';

export const INITIAL_LIVE_AGENT: LiveAgentState = {
  id: 'agent-1',
  name: 'Workspace Research Agent',
  role: 'Documentation & Workspace Reorganizer',
  avatar: '🤖',
  status: 'Working...',
  currentTask: 'Organizing project documentation & asset structure',
  currentAction: 'Moved README.md to /docs/README.md',
  progress: 82,
  activeSince: '10:30 AM',
  currentActionId: 'ACT-92831',
  riskScore: 24,
  policyTier: 'AUTO_EXECUTE',
  checkpointId: 'CP-104',
};

export const INITIAL_ACTIONS: AgentAction[] = [
  {
    id: 'ACT-92831',
    agentId: 'agent-1',
    agentName: 'Workspace Agent',
    agentAvatar: '🤖',
    agentRole: 'Workspace Organizer',
    timestamp: '10:45:03',
    timeAgo: '2 minutes ago',
    type: 'move_file',
    title: 'Moved README.md',
    actionSummary: 'Moved README.md to /project/docs/README.md',
    target: 'README.md',
    sourcePath: '/project/README.md',
    destPath: '/project/docs/README.md',
    previousStateDesc: 'README.md located in root /project/',
    newStateDesc: 'README.md located in /project/docs/',
    reason: 'Organizing documentation according to project structure standards.',
    risk: 'low',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: '1 file will be restored to root directory.',
    affectedFiles: ['/project/README.md', '/project/docs/README.md'],
    snapshotId: 'SNAP-04',
    tags: ['filesystem', 'docs'],
    executionDurationMs: 120,
  },
  {
    id: 'ACT-92830',
    agentId: 'agent-1',
    agentName: 'Workspace Agent',
    agentAvatar: '🤖',
    agentRole: 'Workspace Organizer',
    timestamp: '10:44:16',
    timeAgo: '3 minutes ago',
    type: 'rename_file',
    title: 'Renamed “final_report.pdf”',
    actionSummary: 'Renamed file to final_report_v2.pdf',
    target: 'final_report.pdf',
    sourcePath: '/project/final_report.pdf',
    destPath: '/project/final_report_v2.pdf',
    previousStateDesc: 'File named final_report.pdf',
    newStateDesc: 'File renamed to final_report_v2.pdf',
    reason: 'Standardizing file versioning convention across team assets.',
    risk: 'low',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: 'File name will revert to final_report.pdf.',
    affectedFiles: ['/project/final_report.pdf'],
    snapshotId: 'SNAP-04',
    tags: ['filesystem', 'naming'],
    executionDurationMs: 85,
  },
  {
    id: 'ACT-92829',
    agentId: 'agent-2',
    agentName: 'Cleanup Agent',
    agentAvatar: '🧹',
    agentRole: 'Directory Optimizer',
    timestamp: '10:43:02',
    timeAgo: '4 minutes ago',
    type: 'create_folder',
    title: 'Created folder “Project Docs”',
    actionSummary: 'Created directory /project/docs/',
    target: '/project/docs',
    destPath: '/project/docs',
    previousStateDesc: 'Directory /project/docs did not exist',
    newStateDesc: 'Directory /project/docs created with standard permissions',
    reason: 'Preparing target directory for documentation consolidation.',
    risk: 'low',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: 'Directory /project/docs will be safely removed if empty.',
    affectedFiles: ['/project/docs/'],
    snapshotId: 'SNAP-04',
    tags: ['filesystem', 'structure'],
    executionDurationMs: 95,
  },
  {
    id: 'ACT-92828',
    agentId: 'agent-1',
    agentName: 'Workspace Agent',
    agentAvatar: '🤖',
    agentRole: 'Workspace Organizer',
    timestamp: '10:42:31',
    timeAgo: '5 minutes ago',
    type: 'update_metadata',
    title: 'Updated project metadata',
    actionSummary: 'Updated config.json schema and dependencies hash',
    target: 'config.json',
    sourcePath: '/project/config.json',
    destPath: '/project/config.json',
    previousStateDesc: 'config.json v2.3 with legacy schema',
    newStateDesc: 'config.json v2.4 with updated doc links',
    reason: 'Syncing workspace build settings with newly moved markdown paths.',
    risk: 'medium',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: 'config.json will restore previous schema v2.3.',
    affectedFiles: ['/project/config.json'],
    snapshotId: 'SNAP-03',
    tags: ['metadata', 'config'],
    executionDurationMs: 210,
  },
  {
    id: 'ACT-92827',
    agentId: 'agent-3',
    agentName: 'Security & Audit Agent',
    agentAvatar: '🛡️',
    agentRole: 'Permission Guard',
    timestamp: '10:35:12',
    timeAgo: '12 minutes ago',
    type: 'move_file',
    title: 'Moved architecture.pdf to /docs',
    actionSummary: 'Moved architecture diagram to /project/docs/architecture.pdf',
    target: 'architecture.pdf',
    sourcePath: '/project/architecture.pdf',
    destPath: '/project/docs/architecture.pdf',
    previousStateDesc: '/project/architecture.pdf',
    newStateDesc: '/project/docs/architecture.pdf',
    reason: 'Centralizing technical spec assets into unified documentation hub.',
    risk: 'low',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: 'File returns to root /project/ folder.',
    affectedFiles: ['/project/architecture.pdf'],
    snapshotId: 'SNAP-03',
    tags: ['filesystem', 'docs'],
    executionDurationMs: 140,
  },
  {
    id: 'ACT-92826',
    agentId: 'agent-2',
    agentName: 'Cleanup Agent',
    agentAvatar: '🧹',
    agentRole: 'Directory Optimizer',
    timestamp: '10:20:44',
    timeAgo: '27 minutes ago',
    type: 'delete_file',
    title: 'Pruned temporary cache logs',
    actionSummary: 'Deleted /tmp/build-cache.log (5.2 MB)',
    target: 'build-cache.log',
    sourcePath: '/project/tmp/build-cache.log',
    previousStateDesc: 'build-cache.log existed with 5.2 MB uncompressed logs',
    newStateDesc: 'File was removed from workspace',
    reason: 'Storage cleanup routine triggered by workspace limit threshold.',
    risk: 'medium',
    status: 'undone',
    reversible: true,
    rollbackAvailable: false,
    impact: 'Cached log file was recovered from undo snapshot buffer.',
    affectedFiles: ['/project/tmp/build-cache.log'],
    snapshotId: 'SNAP-02',
    tags: ['cleanup', 'storage'],
    executionDurationMs: 310,
  },
  {
    id: 'ACT-92825',
    agentId: 'agent-1',
    agentName: 'Workspace Agent',
    agentAvatar: '🤖',
    agentRole: 'Workspace Organizer',
    timestamp: '09:55:00',
    timeAgo: '52 minutes ago',
    type: 'create_file',
    title: 'Generated CHANGELOG.md draft',
    actionSummary: 'Generated automated release notes in /project/CHANGELOG.md',
    target: 'CHANGELOG.md',
    destPath: '/project/CHANGELOG.md',
    previousStateDesc: 'CHANGELOG.md was missing',
    newStateDesc: 'CHANGELOG.md created with commit history summary',
    reason: 'Automated repository documentation maintenance.',
    risk: 'low',
    status: 'completed',
    reversible: true,
    rollbackAvailable: true,
    impact: 'CHANGELOG.md draft will be deleted.',
    affectedFiles: ['/project/CHANGELOG.md'],
    snapshotId: 'SNAP-01',
    tags: ['documentation'],
    executionDurationMs: 450,
  }
];

export const INITIAL_SNAPSHOTS: Snapshot[] = [
  {
    id: 'SNAP-04',
    name: 'Snapshot #04',
    createdAt: '25 Sep 2026, 10:45:00',
    relativeTime: '5 min ago',
    actionsCount: 14,
    filesChangedCount: 8,
    status: 'Safe checkpoint',
    isCurrent: true,
    description: 'Post-documentation organization and PDF versioning sweep.',
    fileTreeBefore: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
        { name: 'config.json', path: '/project/config.json', type: 'file', size: '1.4 KB' },
        { name: 'final_report.pdf', path: '/project/final_report.pdf', type: 'file', size: '840 KB' },
        { name: 'architecture.pdf', path: '/project/architecture.pdf', type: 'file', size: '1.2 MB' },
        { name: 'CHANGELOG.md', path: '/project/CHANGELOG.md', type: 'file', size: '2.1 KB' },
      ]}
    ],
    fileTreeAfter: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'docs', path: '/project/docs', type: 'folder', status: 'added', children: [
          { name: 'README.md', path: '/project/docs/README.md', type: 'file', size: '4.2 KB', status: 'moved' },
          { name: 'architecture.pdf', path: '/project/docs/architecture.pdf', type: 'file', size: '1.2 MB', status: 'moved' },
        ]},
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB', status: 'unchanged' },
        { name: 'config.json', path: '/project/config.json', type: 'file', size: '1.5 KB', status: 'modified' },
        { name: 'final_report_v2.pdf', path: '/project/final_report_v2.pdf', type: 'file', size: '840 KB', status: 'moved' },
        { name: 'CHANGELOG.md', path: '/project/CHANGELOG.md', type: 'file', size: '2.1 KB', status: 'unchanged' },
      ]}
    ],
    changes: [
      { path: '/project/docs/', type: 'added', details: 'Created directory' },
      { path: '/project/docs/README.md', type: 'moved', oldPath: '/project/README.md', newPath: '/project/docs/README.md', details: 'Moved from root' },
      { path: '/project/docs/architecture.pdf', type: 'moved', oldPath: '/project/architecture.pdf', newPath: '/project/docs/architecture.pdf', details: 'Moved from root' },
      { path: '/project/final_report_v2.pdf', type: 'moved', oldPath: '/project/final_report.pdf', newPath: '/project/final_report_v2.pdf', details: 'Renamed file' },
      { path: '/project/config.json', type: 'modified', details: 'Updated doc links & schema' },
    ]
  },
  {
    id: 'SNAP-03',
    name: 'Snapshot #03',
    createdAt: '25 Sep 2026, 10:38:00',
    relativeTime: '12 min ago',
    actionsCount: 11,
    filesChangedCount: 5,
    status: 'Safe checkpoint',
    isCurrent: false,
    description: 'Architecture specs centralized into documentation folder.',
    fileTreeBefore: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
        { name: 'config.json', path: '/project/config.json', type: 'file', size: '1.4 KB' },
        { name: 'architecture.pdf', path: '/project/architecture.pdf', type: 'file', size: '1.2 MB' },
      ]}
    ],
    fileTreeAfter: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'docs', path: '/project/docs', type: 'folder', status: 'added', children: [
          { name: 'architecture.pdf', path: '/project/docs/architecture.pdf', type: 'file', size: '1.2 MB', status: 'moved' },
        ]},
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB', status: 'unchanged' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB', status: 'unchanged' },
        { name: 'config.json', path: '/project/config.json', type: 'file', size: '1.4 KB', status: 'unchanged' },
      ]}
    ],
    changes: [
      { path: '/project/docs/', type: 'added', details: 'Created directory' },
      { path: '/project/docs/architecture.pdf', type: 'moved', oldPath: '/project/architecture.pdf', newPath: '/project/docs/architecture.pdf', details: 'Moved from root' },
    ]
  },
  {
    id: 'SNAP-02',
    name: 'Snapshot #02',
    createdAt: '25 Sep 2026, 10:25:00',
    relativeTime: '25 min ago',
    actionsCount: 7,
    filesChangedCount: 3,
    status: 'Safe checkpoint',
    isCurrent: false,
    description: 'Pre-cleanup checkpoint before cache pruning.',
    fileTreeBefore: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
        { name: 'tmp', path: '/project/tmp', type: 'folder', children: [
          { name: 'build-cache.log', path: '/project/tmp/build-cache.log', type: 'file', size: '5.2 MB' }
        ]}
      ]}
    ],
    fileTreeAfter: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
      ]}
    ],
    changes: [
      { path: '/project/tmp/build-cache.log', type: 'removed', details: 'Purged temporary cache' }
    ]
  },
  {
    id: 'SNAP-01',
    name: 'Snapshot #01',
    createdAt: '25 Sep 2026, 09:45:00',
    relativeTime: '1 hour ago',
    actionsCount: 2,
    filesChangedCount: 1,
    status: 'Initial Baseline',
    isCurrent: false,
    description: 'Initial repository baseline when Undo Engine was attached.',
    fileTreeBefore: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
      ]}
    ],
    fileTreeAfter: [
      { name: 'project', path: '/project', type: 'folder', children: [
        { name: 'README.md', path: '/project/README.md', type: 'file', size: '4.2 KB' },
        { name: 'app.py', path: '/project/app.py', type: 'file', size: '12.8 KB' },
        { name: 'CHANGELOG.md', path: '/project/CHANGELOG.md', type: 'file', size: '2.1 KB', status: 'added' }
      ]}
    ],
    changes: [
      { path: '/project/CHANGELOG.md', type: 'added', details: 'Initial changelog seed' }
    ]
  }
];

export const INITIAL_POLICIES: PolicyRule[] = [
  // File Operations
  { id: 'pol-1', name: 'Create files', description: 'Allow agent to generate and write new source or doc files.', enabled: true, requiresApproval: false, category: 'file_ops' },
  { id: 'pol-2', name: 'Move files', description: 'Allow agent to relocate files into better folder trees.', enabled: true, requiresApproval: false, category: 'file_ops' },
  { id: 'pol-3', name: 'Rename files', description: 'Allow agent to standardize file naming conventions.', enabled: true, requiresApproval: false, category: 'file_ops' },
  { id: 'pol-4', name: 'Delete files without approval', description: 'Permanently remove files without human confirmation.', enabled: false, requiresApproval: true, category: 'file_ops' },
  
  // Communication
  { id: 'pol-5', name: 'Draft emails', description: 'Generate email content and staging drafts in mailbox.', enabled: true, requiresApproval: false, category: 'communication' },
  { id: 'pol-6', name: 'Send emails without approval', description: 'Dispatch real external messages to clients automatically.', enabled: false, requiresApproval: true, category: 'communication' },
  
  // Finance
  { id: 'pol-7', name: 'Transactions disabled', description: 'Strict lock: Prevent any automated charge, card or API purchase.', enabled: false, requiresApproval: true, category: 'finance' },
  { id: 'pol-8', name: 'Process refunds under $50', description: 'Issue automatic customer micro-refunds.', enabled: false, requiresApproval: true, category: 'finance' },

  // System
  { id: 'pol-9', name: 'Read data & metadata', description: 'Inspect workspace files, directory indexes, and configs.', enabled: true, requiresApproval: false, category: 'system' },
  { id: 'pol-10', name: 'Modify system settings', description: 'Alter OS environment variables or firewall ports.', enabled: false, requiresApproval: true, category: 'system' },
  { id: 'pol-11', name: 'Execute terminal scripts', description: 'Run shell commands or build scripts in sandbox.', enabled: true, requiresApproval: true, category: 'system' }
];

export const INITIAL_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'AUD-901',
    actionId: 'ACT-92831',
    time: '10:45:03',
    agent: 'Workspace Agent',
    action: 'Moved File',
    resource: 'README.md',
    risk: 'low',
    status: 'Completed',
    reversible: true,
    details: 'Moved from /project/README.md -> /project/docs/README.md',
    ipHash: '192.168.1.104'
  },
  {
    id: 'AUD-902',
    actionId: 'ACT-92830',
    time: '10:44:16',
    agent: 'Workspace Agent',
    action: 'Renamed File',
    resource: 'final_report.pdf',
    risk: 'low',
    status: 'Completed',
    reversible: true,
    details: 'Renamed to final_report_v2.pdf',
    ipHash: '192.168.1.104'
  },
  {
    id: 'AUD-903',
    actionId: 'ACT-92829',
    time: '10:43:02',
    agent: 'Cleanup Agent',
    action: 'Created Folder',
    resource: '/project/docs',
    risk: 'low',
    status: 'Completed',
    reversible: true,
    details: 'Initialized directory with standard chmod 755',
    ipHash: '192.168.1.108'
  },
  {
    id: 'AUD-904',
    actionId: 'ACT-92828',
    time: '10:42:31',
    agent: 'Workspace Agent',
    action: 'Updated Metadata',
    resource: 'config.json',
    risk: 'medium',
    status: 'Completed',
    reversible: true,
    details: 'Schema bump v2.3 -> v2.4',
    ipHash: '192.168.1.104'
  },
  {
    id: 'AUD-905',
    actionId: 'ACT-92827',
    time: '10:35:12',
    agent: 'Security Agent',
    action: 'Moved File',
    resource: 'architecture.pdf',
    risk: 'low',
    status: 'Completed',
    reversible: true,
    details: 'Relocated to /project/docs/architecture.pdf',
    ipHash: '192.168.1.112'
  },
  {
    id: 'AUD-906',
    actionId: 'ACT-92826',
    time: '10:20:44',
    agent: 'Cleanup Agent',
    action: 'Deleted File',
    resource: 'build-cache.log',
    risk: 'medium',
    status: 'Undone',
    reversible: true,
    details: 'Rollback initiated by User Admin. File state restored from SNAP-02.',
    ipHash: '192.168.1.101'
  },
  {
    id: 'AUD-907',
    actionId: 'ACT-92825',
    time: '09:55:00',
    agent: 'Workspace Agent',
    action: 'Created File',
    resource: 'CHANGELOG.md',
    risk: 'low',
    status: 'Completed',
    reversible: true,
    details: 'Created draft commit changelog',
    ipHash: '192.168.1.104'
  }
];
