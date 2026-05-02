import { AccessToken } from 'livekit-server-sdk'
import { config } from '../../config'

interface TokenGrants {
  canPublish: boolean
  canSubscribe: boolean
  canPublishData: boolean
}

export async function getLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  grants: TokenGrants,
): Promise<string> {
  const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: 3600,
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: grants.canPublish,
    canSubscribe: grants.canSubscribe,
    canPublishData: grants.canPublishData,
  })

  return await at.toJwt()
}
