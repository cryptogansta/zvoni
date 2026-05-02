'use client'
import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, Copy, Check, LogIn, Subtitles } from 'lucide-react'
import clsx from 'clsx'

interface LobbyPreviewProps {
  roomTitle: string
  inviteLink: string
  guestName: string
  onGuestNameChange: (v: string) => void
  isAuthenticated: boolean
  userName?: string
  transcriptionEnabled: boolean
  onTranscriptionChange: (v: boolean) => void
  onJoin: () => void
  isJoining: boolean
}

export function LobbyPreview({
  roomTitle, inviteLink, guestName, onGuestNameChange,
  isAuthenticated, userName, transcriptionEnabled, onTranscriptionChange,
  onJoin, isJoining,
}: LobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [streamReady, setStreamReady] = useState(false)
  const [camError, setCamError] = useState('')
  const [copied, setCopied] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startPreview()
    return () => stopPreview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStreamReady(true)
      setCamError('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Нет доступа к камере'
      setCamError(msg.includes('Permission') || msg.includes('denied')
        ? 'Браузер заблокировал камеру. Разрешите доступ в настройках.'
        : msg)
      setStreamReady(false)
    }
  }

  function stopPreview() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
    setCamOn((v) => !v)
  }

  function toggleMic() {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
    setMicOn((v) => !v)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canJoin = isAuthenticated || guestName.trim().length >= 2

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video preview */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-elevated border border-border">
          {streamReady && camOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-2xl font-bold text-accent border border-accent/30">
                {(isAuthenticated ? userName : guestName)?.charAt(0).toUpperCase() ?? '?'}
              </div>
              {camError && <p className="text-xs text-danger text-center px-4">{camError}</p>}
            </div>
          )}

          {/* Preview controls */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            <button onClick={toggleMic} className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', micOn ? 'bg-surface/80 border-border text-text' : 'bg-danger/20 border-danger/40 text-danger')}>
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button onClick={toggleCam} className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', camOn ? 'bg-surface/80 border-border text-text' : 'bg-surface/80 border-border text-muted')}>
              {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Join panel */}
        <div className="flex flex-col justify-center gap-5">
          <div>
            <p className="text-sm text-muted mb-1">Вы входите в звонок</p>
            <h1 className="text-2xl font-bold text-text">{roomTitle}</h1>
          </div>

          {!isAuthenticated && (
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Ваше имя</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => onGuestNameChange(e.target.value)}
                placeholder="Введите имя..."
                className="input"
                minLength={2}
                maxLength={60}
              />
            </div>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl border border-border">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {userName?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>
          )}

          <label className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border cursor-pointer hover:border-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={transcriptionEnabled}
              onChange={(e) => onTranscriptionChange(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <div className="flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-muted" />
              <span className="text-sm">Включить транскрипцию и итоги</span>
            </div>
          </label>

          <div className="flex flex-col gap-2">
            <button
              onClick={onJoin}
              disabled={!canJoin || isJoining}
              className="btn-primary w-full py-3"
            >
              <LogIn className="w-5 h-5" />
              {isJoining ? 'Подключаемся...' : 'Войти в звонок'}
            </button>

            <button onClick={copyLink} className="btn-secondary w-full py-2.5 text-sm">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Ссылка скопирована!' : 'Скопировать ссылку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
