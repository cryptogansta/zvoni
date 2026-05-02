'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useRoom } from '@/lib/hooks/useRoom'
import { LobbyPreview } from '@/components/lobby/LobbyPreview'
import { VideoGrid } from '@/components/call/VideoGrid'
import { ControlBar } from '@/components/call/ControlBar'
import { ConnectionStatus } from '@/components/call/ConnectionStatus'
import { ChatPanel, ChatMessage } from '@/components/chat/ChatPanel'
import { ConnectionState } from 'livekit-client'
import { Video } from 'lucide-react'

interface RoomData {
  id: string
  slug: string
  title: string
  status: string
  inviteLinks?: Array<{ token: string }>
}

interface JoinResult {
  token: string
  participantId: string
  participantName: string
  isGuest: boolean
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, fetchMe } = useAuthStore()

  const isLobby = searchParams.get('lobby') === 'true'

  const [room, setRoom] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isTranscriptionOn, setIsTranscriptionOn] = useState(false)
  const [pageError, setPageError] = useState('')

  const { connect, disconnect, toggleCamera, toggleMic, toggleScreenShare,
    isCameraOn, isMicOn, isScreenSharing, localParticipant, remoteParticipants,
    state: connectionState } = useRoom()

  // Load current user and room data
  useEffect(() => {
    fetchMe().then(() => {
      api.get<RoomData>(`/api/rooms/${roomId}`)
        .then(setRoom)
        .catch(() => setPageError('Комната не найдена'))
        .finally(() => setLoading(false))
    })
  }, [roomId, fetchMe])

  // Setup socket chat
  useEffect(() => {
    if (!joinResult) return
    const socket = getSocket()

    socket.emit('room:join', {
      roomId: joinResult.participantId ? room?.id : roomId,
      participantId: joinResult.participantId,
      participantName: joinResult.participantName,
      isGuest: joinResult.isGuest,
    })

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.off('chat:message')
    }
  }, [joinResult, room, roomId])

  const handleJoin = useCallback(async () => {
    if (!room) return
    setIsJoining(true)
    try {
      const body = user ? {} : { guestName: guestName.trim() }
      const result = await api.post<JoinResult>(`/api/rooms/${room.id}/join`, body)
      setJoinResult(result)

      // Start transcription if enabled
      if (transcriptionEnabled) {
        await api.post(`/api/rooms/${room.id}/transcription/start`)
        setIsTranscriptionOn(true)
      }

      await connect(result.token)
      router.replace(`/room/${roomId}`, { scroll: false })
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Не удалось войти в звонок')
      setIsJoining(false)
    }
  }, [room, user, guestName, transcriptionEnabled, connect, router, roomId])

  const handleEndCall = useCallback(async () => {
    await disconnect()
    if (joinResult && !joinResult.isGuest) {
      await api.post(`/api/rooms/${room?.id}/leave`, {}).catch(() => {})
    }
    disconnectSocket()
    if (isTranscriptionOn && room) {
      await api.post(`/api/rooms/${room.id}/transcription/stop`).catch(() => {})
    }
    router.push(`/room/${roomId}/summary`)
  }, [disconnect, joinResult, room, isTranscriptionOn, router, roomId])

  const handleToggleTranscription = useCallback(async () => {
    if (!room) return
    if (isTranscriptionOn) {
      await api.post(`/api/rooms/${room.id}/transcription/stop`).catch(() => {})
      setIsTranscriptionOn(false)
    } else {
      await api.post(`/api/rooms/${room.id}/transcription/start`).catch(() => {})
      setIsTranscriptionOn(true)
    }
    getSocket().emit('room:transcription_status', {
      roomId: room.id,
      status: isTranscriptionOn ? 'stopped' : 'active',
    })
  }, [room, isTranscriptionOn])

  const handleSendMessage = useCallback((text: string) => {
    if (!joinResult) return
    getSocket().emit('chat:send', {
      roomId: room?.id ?? roomId,
      text,
      participantId: joinResult.participantId,
      participantName: joinResult.participantName,
      isGuest: joinResult.isGuest,
    })
  }, [joinResult, room, roomId])

  const inviteLink = room?.inviteLinks?.[0]
    ? `${window.location.origin}/join/${room.inviteLinks[0].token}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}?lobby=true`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Video className="w-6 h-6 text-bg" />
          </div>
          <p className="text-muted text-sm">Загружаем звонок...</p>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center max-w-sm">
          <p className="text-danger text-lg font-semibold mb-2">Ошибка</p>
          <p className="text-muted text-sm mb-4">{pageError}</p>
          <button onClick={() => router.push('/')} className="btn-secondary px-6 py-2 text-sm">
            На главную
          </button>
        </div>
      </div>
    )
  }

  // Lobby view
  if (isLobby || !joinResult) {
    return (
      <LobbyPreview
        roomTitle={room?.title ?? 'Звонок'}
        inviteLink={inviteLink}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        isAuthenticated={!!user}
        userName={user?.name}
        transcriptionEnabled={transcriptionEnabled}
        onTranscriptionChange={setTranscriptionEnabled}
        onJoin={handleJoin}
        isJoining={isJoining}
      />
    )
  }

  // Active call view
  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <ConnectionStatus state={connectionState} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-bg" />
          </div>
          <span className="font-semibold text-sm">{room?.title ?? 'Звонок'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isTranscriptionOn && (
            <span className="badge-green">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Транскрипция
            </span>
          )}
          <span className="text-xs text-muted">
            {1 + remoteParticipants.length} участн.
          </span>
        </div>
      </div>

      {/* Main: video + chat */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {connectionState === ConnectionState.Connected ? (
            <VideoGrid
              localParticipant={localParticipant}
              remoteParticipants={remoteParticipants}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted text-sm">
                {connectionState === ConnectionState.Connecting ? 'Подключаемся к видео...' : 'Нет соединения'}
              </p>
            </div>
          )}
        </div>

        {isChatOpen && (
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            onClose={() => setIsChatOpen(false)}
            participantName={joinResult.participantName}
          />
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isTranscriptionOn={isTranscriptionOn}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setIsChatOpen((v) => !v)}
        onToggleTranscription={handleToggleTranscription}
        onEndCall={handleEndCall}
        inviteLink={inviteLink}
      />
    </div>
  )
}
