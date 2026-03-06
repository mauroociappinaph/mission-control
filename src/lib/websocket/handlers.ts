import { normalizeModel } from '@/lib/utils'
import { cacheDeviceToken } from '@/lib/device-identity'
import { GatewayFrame, GatewayMessage } from './types'
import { formatAge, isActive, isNonRetryableGatewayError, getGatewayErrorHelp } from './utils'
import { sendConnectHandshake } from './handshake'

export interface StoreActions {
  setConnection: (data: any) => void
  setLastMessage: (message: any) => void
  setSessions: (sessions: any[]) => void
  addLog: (log: any) => void
  updateSpawnRequest: (id: string, data: any) => void
  setCronJobs: (jobs: any[]) => void
  addTokenUsage: (usage: any) => void
  addChatMessage: (message: any) => void
  addNotification: (notification: any) => void
  updateAgent: (id: string, data: any) => void
}

export function handleGatewayMessage(
  message: GatewayMessage,
  actions: StoreActions
) {
  actions.setLastMessage(message)

  if (process.env.NODE_ENV === 'development') {
    console.log('WebSocket message received:', message.type, message)
  }

  switch (message.type) {
    case 'session_update':
      if (message.data?.sessions) {
        actions.setSessions(message.data.sessions.map((session: any, index: number) => ({
          id: session.key || `session-${index}`,
          key: session.key || '',
          kind: session.kind || 'unknown',
          age: session.age || '',
          model: normalizeModel(session.model),
          tokens: session.tokens || '',
          flags: session.flags || [],
          active: session.active || false,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          messageCount: session.messageCount,
          cost: session.cost
        })))
      }
      break

    case 'log':
      if (message.data) {
        actions.addLog({
          id: message.data.id || `log-${Date.now()}-${Math.random()}`,
          timestamp: message.data.timestamp || message.timestamp || Date.now(),
          level: message.data.level || 'info',
          source: message.data.source || 'gateway',
          session: message.data.session,
          message: message.data.message || '',
          data: message.data.extra || message.data.data
        })
      }
      break

    case 'spawn_result':
      if (message.data?.id) {
        actions.updateSpawnRequest(message.data.id, {
          status: message.data.status,
          completedAt: message.data.completedAt,
          result: message.data.result,
          error: message.data.error
        })
      }
      break

    case 'cron_status':
      if (message.data?.jobs) {
        actions.setCronJobs(message.data.jobs)
      }
      break

    case 'event':
      if (message.data?.type === 'token_usage') {
        actions.addTokenUsage({
          model: normalizeModel(message.data.model),
          sessionId: message.data.sessionId,
          date: new Date().toISOString(),
          inputTokens: message.data.inputTokens || 0,
          outputTokens: message.data.outputTokens || 0,
          totalTokens: message.data.totalTokens || 0,
          cost: message.data.cost || 0
        })
      }
      break

    default:
      console.log('Unknown gateway message type:', message.type)
  }
}

export function handleGatewayFrame(
  frame: GatewayFrame,
  ws: WebSocket,
  context: {
    handshakeComplete: boolean
    authToken: string
    nextRequestId: () => string
    handlePong: (id: string) => void
    startHeartbeat: () => void
    stopHeartbeat: () => void
    reconnectAttemptsRef: { current: number }
    handshakeCompleteRef: { current: boolean }
    nonRetryableErrorRef: { current: string | null }
  },
  actions: StoreActions
) {
  console.log('Gateway frame:', frame)

  // Handle connect challenge
  if (frame.type === 'event' && frame.event === 'connect.challenge') {
    console.log('Received connect challenge, sending handshake...')
    sendConnectHandshake(ws, context.authToken, context.nextRequestId, frame.payload?.nonce)
    return
  }

  // Handle connect response (handshake success)
  if (frame.type === 'res' && frame.ok && !context.handshakeCompleteRef.current) {
    console.log('Handshake complete!')
    context.handshakeCompleteRef.current = true
    context.reconnectAttemptsRef.current = 0
    if (frame.result?.deviceToken) {
      cacheDeviceToken(frame.result.deviceToken)
    }
    actions.setConnection({
      isConnected: true,
      lastConnected: new Date(),
      reconnectAttempts: 0
    })
    context.startHeartbeat()
    return
  }

  // Handle pong responses
  if (frame.type === 'res' && frame.id?.startsWith('ping-')) {
    context.handlePong(frame.id)
    return
  }

  // Handle connect error
  if (frame.type === 'res' && !frame.ok) {
    console.error('Gateway error:', frame.error)
    const rawMessage = frame.error?.message || JSON.stringify(frame.error)
    const help = getGatewayErrorHelp(rawMessage)
    const nonRetryable = isNonRetryableGatewayError(rawMessage)

    actions.addLog({
      id: nonRetryable ? `gateway-handshake-${rawMessage}` : `error-${Date.now()}`,
      timestamp: Date.now(),
      level: 'error',
      source: 'gateway',
      message: `Gateway error: ${rawMessage}${nonRetryable ? ` — ${help}` : ''}`
    })

    if (nonRetryable) {
      context.nonRetryableErrorRef.current = rawMessage
      actions.addNotification({
        id: Date.now(),
        recipient: 'operator',
        type: 'error',
        title: 'Gateway Handshake Blocked',
        message: help,
        created_at: Math.floor(Date.now() / 1000),
      })

      context.stopHeartbeat()
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(4001, 'Non-retryable gateway handshake error')
      }
    }
    return
  }

  // Handle broadcast events
  if (frame.type === 'event') {
    if (frame.event === 'tick') {
      const snapshot = frame.payload?.snapshot
      if (snapshot?.sessions) {
        actions.setSessions(snapshot.sessions.map((session: any, index: number) => ({
          id: session.key || `session-${index}`,
          key: session.key || '',
          kind: session.kind || 'unknown',
          age: formatAge(session.updatedAt),
          model: normalizeModel(session.model),
          tokens: `${session.totalTokens || 0}/${session.contextTokens || 35000}`,
          flags: [],
          active: isActive(session.updatedAt),
          startTime: session.updatedAt,
          lastActivity: session.updatedAt,
          messageCount: session.messageCount,
          cost: session.cost
        })))
      }
    } else if (frame.event === 'log') {
      const logData = frame.payload
      if (logData) {
        actions.addLog({
          id: logData.id || `log-${Date.now()}-${Math.random()}`,
          timestamp: logData.timestamp || Date.now(),
          level: logData.level || 'info',
          source: logData.source || 'gateway',
          session: logData.session,
          message: logData.message || '',
          data: logData.extra || logData.data
        })
      }
    } else if (frame.event === 'chat.message') {
      const msg = frame.payload
      if (msg) {
        actions.addChatMessage({
          id: msg.id,
          conversation_id: msg.conversation_id,
          from_agent: msg.from_agent,
          to_agent: msg.to_agent,
          content: msg.content,
          message_type: msg.message_type || 'text',
          metadata: msg.metadata,
          read_at: msg.read_at,
          created_at: msg.created_at || Math.floor(Date.now() / 1000),
        })
      }
    } else if (frame.event === 'notification') {
      const notif = frame.payload
      if (notif) {
        actions.addNotification({
          id: notif.id,
          recipient: notif.recipient || 'operator',
          type: notif.type || 'info',
          title: notif.title || '',
          message: notif.message || '',
          source_type: notif.source_type,
          source_id: notif.source_id,
          created_at: notif.created_at || Math.floor(Date.now() / 1000),
        })
      }
    } else if (frame.event === 'agent.status') {
      const data = frame.payload
      if (data?.id) {
        actions.updateAgent(data.id, {
          status: data.status,
          last_seen: data.last_seen,
          last_activity: data.last_activity,
        })
      }
    }
  }
}
