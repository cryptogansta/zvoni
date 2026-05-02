'use client'
import { LocalParticipant, RemoteParticipant } from 'livekit-client'
import { VideoTile } from './VideoTile'
import clsx from 'clsx'

interface VideoGridProps {
  localParticipant: LocalParticipant | null
  remoteParticipants: RemoteParticipant[]
}

export function VideoGrid({ localParticipant, remoteParticipants }: VideoGridProps) {
  const total = (localParticipant ? 1 : 0) + remoteParticipants.length

  return (
    <div
      className={clsx(
        'grid gap-2 w-full h-full p-2',
        total <= 1 && 'grid-cols-1',
        total === 2 && 'grid-cols-2',
        total > 2 && total <= 4 && 'grid-cols-2',
        total > 4 && 'grid-cols-3',
      )}
    >
      {localParticipant && (
        <VideoTile participant={localParticipant} isLocal className="min-h-0" />
      )}
      {remoteParticipants.map((p) => (
        <VideoTile key={p.identity} participant={p} className="min-h-0" />
      ))}
      {total === 0 && (
        <div className="col-span-full flex items-center justify-center text-muted text-sm">
          Ждём участников...
        </div>
      )}
    </div>
  )
}
