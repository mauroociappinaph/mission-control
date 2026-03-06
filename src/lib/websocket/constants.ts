// Gateway protocol version (v3 required by OpenClaw 2026.x)
export const PROTOCOL_VERSION = 3
export const DEFAULT_GATEWAY_CLIENT_ID = process.env.NEXT_PUBLIC_GATEWAY_CLIENT_ID || 'openclaw'

// Heartbeat configuration
export const PING_INTERVAL_MS = 30_000
export const MAX_MISSED_PONGS = 3
