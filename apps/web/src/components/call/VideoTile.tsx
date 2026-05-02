'use client'
import { useEffect, useRef } from 'react'
import { Participant, Track } from 'livekit-client'
import { MicOff, VideoOff } from 'lucide-react'
import clsx from 'clsx'

interface VideoTileProps {
  participant: Participant
  isLocal?: boolean
  className?: string
}

export function VideoTile({ participant, isLocal, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    function attach() {
      for (const pub of participant.trackPublications.values()) {
        if (pub.track?.kind === Track.Kind.Video && videoRef.current && pub.track.mediaStream) {
          videoRef.current.srcObject = pub.track.mediaStream
        }
        if (pub.track?.kind === Track.Kind.Audio && audioRef.current && !isLocal && pub.track.mediaStream) {
          audioRef.current.srcObject = pub.track.mediaStream
        }
      }
    }
    participant.on('trackSubscribed', attach)
    participant.on('trackUnsubscribed', attach)
    participant.on('trackMuted', attach)
    participant.on('trackUnmuted', attach)
    attach()
    return () => {
      participant.off('trackSubscribed', attach)
      participant.off('trackUnsubscribed', attach)
      participant.off('trackMuted', attach)
      participant.off('trackUnmuted', attach)
    }
  }, [participant, isLocal])

  const hasCam = Array.from(participant.trackPublications.values()).some(
    (p) => p.source === Track.Source.Camera && !p.isMuted,
  )
  const hasMic = Array.from(participant.trackPublications.values()).some(
    (p) => p.source === Track.Source.Microphone && !p.isMuted,
  )

  return (
    <div
      className={clsx(
        'relative rounded-2xl overflow-hidden bg-surface-elevated flex items-center justify-center border border-border',
        className,
      )}
    >
      {hasCam ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
          style={{ transform: isLocal ? 'scaleX(-1)' : undefined }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-2xl font-bold text-accent border border-accent/30">
            {participant.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span className="text-sm text-muted">{participant.name ?? 'Участник'}</span>
        </div>
      )}

      {!isLocal && <audio ref={audioRef} autoPlay />}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-sm font-medium text-white truncate max-w-[70%]">
          {participant.name ?? 'Участник'}
          {isLocal && ' (Вы)'}
        </span>
        <div className="flex items-center gap-1">
          {!hasMic && <MicOff className="w-3.5 h-3.5 text-danger" />}
          {!hasCam && <VideoOff className="w-3.5 h-3.5 text-muted" />}
        </div>
      </div>
    </div>
  )
}
