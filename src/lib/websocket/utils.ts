export function isNonRetryableGatewayError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('origin not allowed') ||
    normalized.includes('device identity required') ||
    normalized.includes('device_auth_signature_invalid') ||
    normalized.includes('auth rate limit') ||
    normalized.includes('rate limited')
  )
}

export function getGatewayErrorHelp(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('origin not allowed')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '<control-ui-origin>'
    return `Gateway rejected browser origin. Add ${origin} to gateway.controlUi.allowedOrigins on the gateway, then reconnect.`
  }
  if (normalized.includes('device identity required')) {
    return 'Gateway requires device identity. Open Mission Control via HTTPS (or localhost), then reconnect so WebCrypto signing can run.'
  }
  if (normalized.includes('device_auth_signature_invalid')) {
    return 'Gateway rejected device signature. Clear local device identity in the browser and reconnect.'
  }
  if (normalized.includes('auth rate limit') || normalized.includes('rate limited')) {
    return 'Gateway authentication is rate limited. Wait briefly, then reconnect.'
  }
  return 'Gateway handshake failed. Check gateway control UI origin and device identity settings, then reconnect.'
}

export function formatAge(timestamp: number): string {
  if (!timestamp) return '-'
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

export function isActive(timestamp: number): boolean {
  if (!timestamp) return false
  return Date.now() - timestamp < 60 * 60 * 1000
}
