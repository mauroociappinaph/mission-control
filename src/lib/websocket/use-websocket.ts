'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useMissionControl } from '@/store'
import { GatewayFrame } from './types'
import { PING_INTERVAL_MS, MAX_MISSED_PONGS, DEFAULT_GATEWAY_CLIENT_ID } from './constants'
import { handleGatewayFrame } from './handlers'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const maxReconnectAttempts = 10
  const reconnectUrl = useRef<string>('')
  const authTokenRef = useRef<string>('')
  const requestIdRef = useRef<number>(0)
  const handshakeCompleteRef = useRef<boolean>(false)
  const reconnectAttemptsRef = useRef<number>(0)
  const manualDisconnectRef = useRef<boolean>(false)
  const nonRetryableErrorRef = useRef<string | null>(null)
  const connectRef = useRef<(url: string, token?: string) => void>(() => {})

  // Heartbeat tracking
  const pingCounterRef = useRef<number>(0)
  const pingSentTimestamps = useRef<Map<string, number>>(new Map())
  const missedPongsRef = useRef<number>(0)

  const store = useMissionControl()
  const { connection, setConnection, addLog } = store

  // Generate unique request ID
  const nextRequestId = useCallback(() => {
    requestIdRef.current += 1
    return `mc-${requestIdRef.current}`
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = undefined
    }
    missedPongsRef.current = 0
    pingSentTimestamps.current.clear()
  }, [])

  // Start heartbeat ping interval
  const startHeartbeat = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)

    pingIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !handshakeCompleteRef.current) return

      // Check missed pongs
      if (missedPongsRef.current >= MAX_MISSED_PONGS) {
        console.warn(`Missed ${MAX_MISSED_PONGS} pongs, triggering reconnect`)
        addLog({
          id: `heartbeat-${Date.now()}`,
          timestamp: Date.now(),
          level: 'warn',
          source: 'websocket',
          message: `No heartbeat response after ${MAX_MISSED_PONGS} attempts, reconnecting...`
        })
        wsRef.current?.close(4000, 'Heartbeat timeout')
        return
      }

      pingCounterRef.current += 1
      const pingId = `ping-${pingCounterRef.current}`
      pingSentTimestamps.current.set(pingId, Date.now())
      missedPongsRef.current += 1

      const pingFrame = {
        type: 'req',
        method: 'ping',
        id: pingId,
      }

      try {
        wsRef.current.send(JSON.stringify(pingFrame))
      } catch {
        // Send failed, will be caught by reconnect logic
      }
    }, PING_INTERVAL_MS)
  }, [addLog])

  // Handle pong response - calculate RTT
  const handlePong = useCallback((frameId: string) => {
    const sentAt = pingSentTimestamps.current.get(frameId)
    if (sentAt) {
      const rtt = Date.now() - sentAt
      pingSentTimestamps.current.delete(frameId)
      missedPongsRef.current = 0
      setConnection({ latency: rtt })
    }
  }, [setConnection])

  const connect = useCallback((url: string, token?: string) => {
    const state = wsRef.current?.readyState
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
      return // Already connected or connecting
    }

    const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const urlToken = urlObj.searchParams.get('token')
    authTokenRef.current = token || urlToken || ''

    urlObj.searchParams.delete('token')

    reconnectUrl.current = url
    handshakeCompleteRef.current = false
    manualDisconnectRef.current = false
    nonRetryableErrorRef.current = null

    const wsUrlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (!wsUrlObj.searchParams.has('client[id]')) {
      wsUrlObj.searchParams.set('client[id]', DEFAULT_GATEWAY_CLIENT_ID)
    }
    if (authTokenRef.current && !wsUrlObj.searchParams.has('token')) {
      wsUrlObj.searchParams.set('token', authTokenRef.current)
    }

    try {
      const ws = new WebSocket(wsUrlObj.toString())
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrlObj.toString())
        setConnection({
          url: url.split('?')[0],
          reconnectAttempts: 0
        })
      }

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data) as GatewayFrame
          handleGatewayFrame(
            frame,
            ws,
            {
              handshakeComplete: handshakeCompleteRef.current,
              authToken: authTokenRef.current,
              nextRequestId,
              handlePong,
              startHeartbeat,
              stopHeartbeat,
              reconnectAttemptsRef,
              handshakeCompleteRef,
              nonRetryableErrorRef,
            },
            store
          )
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
          addLog({
            id: `raw-${Date.now()}`,
            timestamp: Date.now(),
            level: 'debug',
            source: 'websocket',
            message: `Raw message: ${event.data}`
          })
        }
      }

      ws.onclose = (event) => {
        console.log('Disconnected from Gateway:', event.code, event.reason)
        setConnection({ isConnected: false })
        handshakeCompleteRef.current = false
        stopHeartbeat()

        if (manualDisconnectRef.current) return
        if (nonRetryableErrorRef.current) {
          setConnection({ reconnectAttempts: 0 })
          return
        }

        const attempts = reconnectAttemptsRef.current
        if (attempts < maxReconnectAttempts) {
          const base = Math.min(Math.pow(2, attempts) * 1000, 30000)
          const timeout = Math.round(base + Math.random() * base * 0.5)
          console.log(`Reconnecting in ${timeout}ms... (attempt ${attempts + 1}/${maxReconnectAttempts})`)

          reconnectAttemptsRef.current = attempts + 1
          setConnection({ reconnectAttempts: attempts + 1 })
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current(reconnectUrl.current, authTokenRef.current)
          }, timeout)
        } else {
          console.error('Max reconnection attempts reached.')
          addLog({
            id: `error-${Date.now()}`,
            timestamp: Date.now(),
            level: 'error',
            source: 'websocket',
            message: 'Max reconnection attempts reached. Please reconnect manually.'
          })
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        addLog({
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          level: 'error',
          source: 'websocket',
          message: `WebSocket error occurred`
        })
      }

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setConnection({ isConnected: false })
    }
  }, [setConnection, addLog, stopHeartbeat, nextRequestId, handlePong, startHeartbeat, store])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true
    reconnectAttemptsRef.current = 0

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    stopHeartbeat()

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }

    handshakeCompleteRef.current = false
    setConnection({
      isConnected: false,
      reconnectAttempts: 0,
      latency: undefined
    })
  }, [setConnection, stopHeartbeat])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && handshakeCompleteRef.current) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    if (reconnectUrl.current) {
      setTimeout(() => connect(reconnectUrl.current, authTokenRef.current), 1000)
    }
  }, [connect, disconnect])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected: connection.isConnected,
    connectionState: connection,
    connect,
    disconnect,
    reconnect,
    sendMessage
  }
}
