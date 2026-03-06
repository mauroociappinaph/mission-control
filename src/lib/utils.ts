import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Session, Agent, AgentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function formatAge(ageStr: string): string {
  // Convert age strings like "1h ago", "just now" to consistent format
  if (ageStr === 'just now') return '< 1m'
  if (ageStr.includes('ago')) {
    return ageStr.replace(' ago', '')
  }
  return ageStr
}

export function parseTokenUsage(tokens: string): { used: number; total: number; percentage: number } {
  // Parse token strings like "49k/35k (139%)" or "15k/35k (43%)"
  const match = tokens.match(/(\d+(?:\.\d+)?)(k|m)?\/(\d+(?:\.\d+)?)(k|m)?\s*\((\d+(?:\.\d+)?)%\)/)
  if (!match) return { used: 0, total: 0, percentage: 0 }

  const used = parseFloat(match[1]) * (match[2] === 'k' ? 1000 : match[2] === 'm' ? 1000000 : 1)
  const total = parseFloat(match[3]) * (match[4] === 'k' ? 1000 : match[4] === 'm' ? 1000000 : 1)
  const percentage = parseFloat(match[5])

  return { used, total, percentage }
}

export function getStatusStyles(status?: string): { text: string; bg: string; border: string; dot: string } {
  const s = status?.toLowerCase() || 'unknown'
  
  switch (s) {
    case 'active':
    case 'success':
    case 'online':
      return { 
        text: 'text-green-400', 
        bg: 'bg-green-500/20', 
        border: 'border-green-500/30',
        dot: 'bg-green-500'
      }
    case 'warning':
    case 'pending':
      return { 
        text: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        border: 'border-yellow-500/30',
        dot: 'bg-yellow-500'
      }
    case 'critical':
    case 'error':
    case 'failed':
      return { 
        text: 'text-red-400', 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30',
        dot: 'bg-red-500'
      }
    case 'running':
    case 'processing':
      return { 
        text: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        border: 'border-blue-500/30',
        dot: 'bg-blue-500'
      }
    case 'idle':
    case 'offline':
    default:
      return { 
        text: 'text-muted-foreground', 
        bg: 'bg-gray-500/20', 
        border: 'border-gray-500/30',
        dot: 'bg-gray-500'
      }
  }
}

export function getStatusColor(status: string): string {
  return getStatusStyles(status).text
}

export function getStatusBadgeColor(status: string): string {
  const styles = getStatusStyles(status)
  return `${styles.bg} ${styles.text} ${styles.border}`
}

/** Normalize model field — OpenClaw 2026.3.x may send {primary: "model-name"} instead of a string */
export function normalizeModel(model: unknown): string {
  if (typeof model === 'string') return model
  if (model && typeof model === 'object' && 'primary' in model) return String((model as any).primary)
  return ''
}

export function getSessionTypeIcon(sessionKey: string): string {
  if (sessionKey.includes(':main:main')) return '👑' // Main session
  if (sessionKey.includes(':subagent:')) return '🤖' // Sub-agent
  if (sessionKey.includes(':cron:')) return '⏰' // Cron job
  if (sessionKey.includes(':group:')) return '👥' // Group session
  return '💬' // Default
}

export function getSessionType(sessionKey: string): string {
  if (sessionKey.includes(':main:main')) return 'Main'
  if (sessionKey.includes(':subagent:')) return 'Sub-agent'
  if (sessionKey.includes(':cron:')) return 'Cron'
  if (sessionKey.includes(':group:')) return 'Group'
  return 'Unknown'
}

export function sessionToAgent(session: Session): Agent {
  const getStatusFromSession = (session: Session): AgentStatus['status'] => {
    if (session.age === 'just now' || session.age.includes('m ago')) return 'active'
    if (session.age.includes('h ago')) return 'idle'
    return 'offline'
  }

  return {
    id: session.id,
    name: session.key.split(':').pop() || session.key,
    type: session.kind === 'direct' ? 
      (session.key.includes('subag') ? 'subagent' : 
       session.key.includes('cron') ? 'cron' : 'main') : 'group',
    status: getStatusFromSession(session),
    model: session.model,
    session
  }
}

export function generateNodePosition(index: number, total: number): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI
  const radius = Math.min(300, 50 + total * 10)
  return {
    x: 400 + Math.cos(angle) * radius,
    y: 300 + Math.sin(angle) * radius
  }
}