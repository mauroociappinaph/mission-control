import { MODEL_CATALOG } from '@/lib/models'

export interface Session {
  id: string
  key: string
  kind: string
  age: string
  model: string
  tokens: string
  flags: string[]
  active: boolean
  startTime?: number
  lastActivity?: number
  messageCount?: number
  cost?: number
}

export interface LogEntry {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  session?: string
  message: string
  data?: any
}

export interface CronJob {
  id?: string
  name: string
  schedule: string
  command: string
  model?: string
  agentId?: string
  timezone?: string
  delivery?: string
  enabled: boolean
  lastRun?: number
  nextRun?: number
  lastStatus?: 'success' | 'error' | 'running'
  lastError?: string
}

export interface SpawnRequest {
  id: string
  task: string
  model: string
  label: string
  timeoutSeconds: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
  result?: string
  error?: string
}

export interface MemoryFile {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  modified?: number
  children?: MemoryFile[]
}

export interface TokenUsage {
  model: string
  sessionId: string
  date: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
}

export interface ModelConfig {
  alias: string
  name: string
  provider: string
  description: string
  costPer1k: number
}

export interface Task {
  id: number
  title: string
  description?: string
  status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'quality_review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  assigned_to?: string
  created_by: string
  created_at: number
  updated_at: number
  due_date?: number
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  metadata?: any
}

export interface Agent {
  id: number
  name: string
  role: string
  session_key?: string
  soul_content?: string
  status: 'offline' | 'idle' | 'busy' | 'error'
  last_seen?: number
  last_activity?: string
  created_at: number
  updated_at: number
  config?: any
  taskStats?: {
    total: number
    assigned: number
    in_progress: number
    completed: number
  }
}

export interface Activity {
  id: number
  type: string
  entity_type: string
  entity_id: number
  actor: string
  description: string
  data?: any
  created_at: number
  entity?: {
    type: string
    id?: number
    title?: string
    name?: string
    status?: string
    content_preview?: string
    task_title?: string
  }
}

export interface Notification {
  id: number
  recipient: string
  type: string
  title: string
  message: string
  source_type?: string
  source_id?: number
  read_at?: number
  delivered_at?: number
  created_at: number
  source?: {
    type: string
    id?: number
    title?: string
    name?: string
    status?: string
    content_preview?: string
    task_title?: string
  }
}

export interface Comment {
  id: number
  task_id: number
  author: string
  content: string
  created_at: number
  parent_id?: number
  mentions?: string[]
  replies?: Comment[]
}

export interface ChatMessage {
  id: number
  conversation_id: string
  from_agent: string
  to_agent: string | null
  content: string
  message_type: 'text' | 'system' | 'handoff' | 'status' | 'command'
  metadata?: any
  read_at?: number
  created_at: number
  pendingStatus?: 'sending' | 'sent' | 'failed'
}

export interface Conversation {
  id: string
  name?: string
  participants: string[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: number
}

export interface StandupReport {
  date: string
  generatedAt: string
  summary: {
    totalAgents: number
    totalCompleted: number
    totalInProgress: number
    totalAssigned: number
    totalReview: number
    totalBlocked: number
    totalActivity: number
    overdue: number
  }
  agentReports: Array<{
    agent: {
      name: string
      role: string
      status: string
      last_seen?: number
      last_activity?: string
    }
    completedToday: Task[]
    inProgress: Task[]
    assigned: Task[]
    review: Task[]
    blocked: Task[]
    activity: {
      actionCount: number
      commentsCount: number
    }
  }>
  teamAccomplishments: Task[]
  teamBlockers: Task[]
  overdueTasks: Task[]
}

export interface CurrentUser {
  id: number
  username: string
  display_name: string
  role: 'admin' | 'operator' | 'viewer'
  provider?: 'local' | 'google'
  email?: string | null
  avatar_url?: string | null
}

export interface ConnectionStatus {
  isConnected: boolean
  url: string
  lastConnected?: Date
  reconnectAttempts: number
  latency?: number
  sseConnected?: boolean
}

export interface MissionControlState {
  // Dashboard Mode
  dashboardMode: 'full' | 'local'
  gatewayAvailable: boolean
  bannerDismissed: boolean
  subscription: { type: string; rateLimitTier?: string } | null

  // Update availability
  updateAvailable: { latestVersion: string; releaseUrl: string; releaseNotes: string } | null
  updateDismissedVersion: string | null

  // WebSocket & Connection
  connection: ConnectionStatus
  lastMessage: any

  // UI State
  activeTab: string
  sidebarExpanded: boolean
  collapsedGroups: string[]
  liveFeedOpen: boolean

  // Auth
  currentUser: CurrentUser | null

  // Mission Control Phase 2 - Tasks
  tasks: Task[]
  selectedTask: Task | null

  // Mission Control Phase 2 - Agents
  agents: Agent[]
  selectedAgent: Agent | null

  // Mission Control Phase 2 - Activities
  activities: Activity[]

  // Mission Control Phase 2 - Notifications
  notifications: Notification[]
  unreadNotificationCount: number

  // Mission Control Phase 2 - Comments
  taskComments: Record<number, Comment[]>

  // Mission Control Phase 2 - Standup
  standupReports: StandupReport[]
  currentStandupReport: StandupReport | null

  // Sessions
  sessions: Session[]
  selectedSession: string | null

  // Logs
  logs: LogEntry[]
  logFilters: {
    level?: string
    source?: string
    session?: string
    search?: string
  }

  // Agent Spawning
  spawnRequests: SpawnRequest[]

  // Cron Management
  cronJobs: CronJob[]

  // Memory Browser
  memoryFiles: MemoryFile[]
  selectedMemoryFile: string | null
  memoryContent: string | null

  // Token Usage & Cost Tracking
  tokenUsage: TokenUsage[]

  // Model Configuration
  availableModels: ModelConfig[]

  // Agent Chat
  chatMessages: ChatMessage[]
  conversations: Conversation[]
  activeConversation: string | null
  chatInput: string
  isSendingMessage: boolean
  chatPanelOpen: boolean
}

export interface MissionControlActions {
  setDashboardMode: (mode: 'full' | 'local') => void
  setGatewayAvailable: (available: boolean) => void
  dismissBanner: () => void
  setSubscription: (sub: { type: string; rateLimitTier?: string } | null) => void
  setUpdateAvailable: (info: { latestVersion: string; releaseUrl: string; releaseNotes: string } | null) => void
  dismissUpdate: (version: string) => void
  setConnection: (connection: Partial<ConnectionStatus>) => void
  setLastMessage: (message: any) => void
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  toggleGroup: (groupId: string) => void
  toggleLiveFeed: () => void
  setCurrentUser: (user: CurrentUser | null) => void
  setTasks: (tasks: Task[]) => void
  setSelectedTask: (task: Task | null) => void
  addTask: (task: Task) => void
  updateTask: (taskId: number, updates: Partial<Task>) => void
  deleteTask: (taskId: number) => void
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (agentId: number, updates: Partial<Agent>) => void
  deleteAgent: (agentId: number) => void
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (notificationId: number) => void
  markAllNotificationsRead: () => void
  setTaskComments: (taskId: number, comments: Comment[]) => void
  addTaskComment: (taskId: number, comment: Comment) => void
  setStandupReports: (reports: StandupReport[]) => void
  setCurrentStandupReport: (report: StandupReport | null) => void
  setSessions: (sessions: Session[]) => void
  setSelectedSession: (sessionId: string | null) => void
  updateSession: (sessionId: string, updates: Partial<Session>) => void
  addLog: (log: LogEntry) => void
  setLogFilters: (filters: Partial<{
    level?: string
    source?: string
    session?: string
    search?: string
  }>) => void
  clearLogs: () => void
  addSpawnRequest: (request: SpawnRequest) => void
  updateSpawnRequest: (id: string, updates: Partial<SpawnRequest>) => void
  setCronJobs: (jobs: CronJob[]) => void
  updateCronJob: (name: string, updates: Partial<CronJob>) => void
  setMemoryFiles: (files: MemoryFile[]) => void
  setSelectedMemoryFile: (path: string | null) => void
  setMemoryContent: (content: string | null) => void
  addTokenUsage: (usage: TokenUsage) => void
  getUsageByModel: (timeframe: 'day' | 'week' | 'month') => Record<string, number>
  getTotalCost: (timeframe: 'day' | 'week' | 'month') => number
  setAvailableModels: (models: ModelConfig[]) => void
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void
  replacePendingMessage: (tempId: number, message: ChatMessage) => void
  updatePendingMessage: (tempId: number, updates: Partial<ChatMessage>) => void
  removePendingMessage: (tempId: number) => void
  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (conversationId: string | null) => void
  setChatInput: (input: string) => void
  setIsSendingMessage: (loading: boolean) => void
  setChatPanelOpen: (open: boolean) => void
  markConversationRead: (conversationId: string) => void
}

export type MissionControlStore = MissionControlState & MissionControlActions
