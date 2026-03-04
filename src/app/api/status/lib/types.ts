/**
 * System status types
 */

export interface SystemStatus {
  timestamp: number;
  uptime: number;
  memory: MemoryInfo;
  disk: DiskInfo;
  sessions: SessionInfo;
  processes: ProcessInfo[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  available: number;
}

export interface DiskInfo {
  total: string;
  used: string;
  available: string;
  usage: string;
}

export interface SessionInfo {
  total: number;
  active: number;
}

export interface ProcessInfo {
  pid: string;
  command: string;
}

export interface GatewayStatus {
  running: boolean;
  port: number;
  pid: string | null;
  uptime: number;
  version: string | null;
  connections: number;
  port_listening?: boolean;
}

export interface HealthCheck {
  overall: 'healthy' | 'warning' | 'unhealthy';
  checks: HealthCheckItem[];
  timestamp: number;
}

export interface HealthCheckItem {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'error' | 'unhealthy';
  message: string;
}

export interface Capabilities {
  gateway: boolean;
  openclawHome: boolean;
  claudeHome: boolean;
  claudeSessions: number;
  subscription: {
    type: string;
    rateLimitTier?: string;
  } | null;
}

export interface DbStats {
  tasks: {
    total: number;
    byStatus: Record<string, number>;
  };
  agents: {
    total: number;
    byStatus: Record<string, number>;
  };
  audit: {
    day: number;
    week: number;
    loginFailures: number;
  };
  activities: {
    day: number;
  };
  notifications: {
    unread: number;
  };
  pipelines: {
    active: number;
    recentDay: number;
  };
  backup: {
    name: string;
    size: number;
    age_hours: number;
  } | null;
  dbSizeBytes: number;
  webhookCount: number;
}

export interface ModelInfo {
  alias: string;
  name: string;
  provider: string;
  description: string;
  costPer1k: number;
  size?: string;
}
