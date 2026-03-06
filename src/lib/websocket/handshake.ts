import {
  getOrCreateDeviceIdentity,
  signPayload,
  getCachedDeviceToken,
} from '@/lib/device-identity'
import { APP_VERSION } from '@/lib/version'
import { PROTOCOL_VERSION, DEFAULT_GATEWAY_CLIENT_ID } from './constants'

export async function sendConnectHandshake(
  ws: WebSocket,
  authToken: string | undefined,
  nextRequestId: () => string,
  nonce?: string
) {
  let device: {
    id: string
    publicKey: string
    signature: string
    signedAt: number
    nonce: string
  } | undefined

  const cachedToken = getCachedDeviceToken()

  const clientId = DEFAULT_GATEWAY_CLIENT_ID
  const clientMode = 'ui'
  const role = 'operator'
  const scopes = ['operator.admin']
  const tokenForSignature = authToken ?? cachedToken ?? ''

  if (nonce) {
    try {
      const identity = await getOrCreateDeviceIdentity()
      const signedAt = Date.now()
      // Sign OpenClaw v2 device-auth payload (gateway accepts v2 and v3).
      const payload = [
        'v2',
        identity.deviceId,
        clientId,
        clientMode,
        role,
        scopes.join(','),
        String(signedAt),
        tokenForSignature,
        nonce,
      ].join('|')

      const { signature } = await signPayload(identity.privateKey, payload, signedAt)
      device = {
        id: identity.deviceId,
        publicKey: identity.publicKeyBase64,
        signature,
        signedAt,
        nonce,
      }
    } catch (err) {
      console.warn('Device identity unavailable, proceeding without:', err)
    }
  }

  const connectRequest = {
    type: 'req',
    method: 'connect',
    id: nextRequestId(),
    params: {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: clientId,
        displayName: 'Mission Control',
        version: APP_VERSION,
        platform: 'web',
        mode: clientMode,
        instanceId: `mc-${Date.now()}`
      },
      role,
      scopes,
      auth: authToken ? { token: authToken } : undefined,
      device,
      deviceToken: cachedToken || undefined,
    }
  }
  console.log('Sending connect handshake:', connectRequest)
  ws.send(JSON.stringify(connectRequest))
}
