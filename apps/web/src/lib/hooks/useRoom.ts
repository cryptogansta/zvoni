import { useState, useEffect, useRef, useCallback } from 'react'
import { Room, RoomEvent, ConnectionState, LocalParticipant, RemoteParticipant, Participant } from 'livekit-client'

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880'

export interface RoomState {
  room: Room | null
  state: ConnectionState
  localParticipant: LocalParticipant | null
  remoteParticipants: RemoteParticipant[]
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown'
  error: string | null
}

export function useRoom() {
  const roomRef = useRef<Room | null>(null)
  const [state, setState] = useState<RoomState>({
    room: null,
    state: ConnectionState.Disconnected,
    localParticipant: null,
    remoteParticipants: [],
    isCameraOn: true,
    isMicOn: true,
    isScreenSharing: false,
    connectionQuality: 'unknown',
    error: null,
  })

  const updateParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return
    setState((prev) => ({
      ...prev,
      remoteParticipants: Array.from(room.remoteParticipants.values()),
    }))
  }, [])

  const connect = useCallback(async (token: string) => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: { resolution: { width: 1280, height: 720 } },
    })
    roomRef.current = room

    room.on(RoomEvent.ConnectionStateChanged, (s: ConnectionState) =>
      setState((prev) => ({ ...prev, state: s }))
    )
    room.on(RoomEvent.ParticipantConnected, updateParticipants)
    room.on(RoomEvent.ParticipantDisconnected, updateParticipants)
    room.on(RoomEvent.TrackSubscribed, updateParticipants)
    room.on(RoomEvent.TrackUnsubscribed, updateParticipants)
    room.on(RoomEvent.LocalTrackPublished, () => {
      const lp = room.localParticipant
      setState((prev) => ({
        ...prev,
        localParticipant: lp,
        isCameraOn: lp.isCameraEnabled,
        isMicOn: lp.isMicrophoneEnabled,
        isScreenSharing: lp.isScreenShareEnabled,
      }))
    })
    room.on(RoomEvent.LocalTrackUnpublished, () => {
      const lp = room.localParticipant
      setState((prev) => ({
        ...prev,
        localParticipant: lp,
        isCameraOn: lp.isCameraEnabled,
        isMicOn: lp.isMicrophoneEnabled,
        isScreenSharing: lp.isScreenShareEnabled,
      }))
    })
    room.on(RoomEvent.Disconnected, () => {
      setState((prev) => ({ ...prev, state: ConnectionState.Disconnected, remoteParticipants: [] }))
    })

    try {
      await room.connect(LIVEKIT_URL, token, {
        autoSubscribe: true,
      })
      await room.localParticipant.enableCameraAndMicrophone()
      setState((prev) => ({
        ...prev,
        room,
        state: room.state,
        localParticipant: room.localParticipant,
        isCameraOn: room.localParticipant.isCameraEnabled,
        isMicOn: room.localParticipant.isMicrophoneEnabled,
        remoteParticipants: Array.from(room.remoteParticipants.values()),
        error: null,
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения'
      setState((prev) => ({ ...prev, error: msg }))
    }
  }, [updateParticipants])

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }
    setState((prev) => ({
      ...prev,
      room: null,
      state: ConnectionState.Disconnected,
      localParticipant: null,
      remoteParticipants: [],
    }))
  }, [])

  const toggleCamera = useCallback(async () => {
    const lp = roomRef.current?.localParticipant
    if (!lp) return
    await lp.setCameraEnabled(!lp.isCameraEnabled)
    setState((prev) => ({ ...prev, isCameraOn: lp.isCameraEnabled }))
  }, [])

  const toggleMic = useCallback(async () => {
    const lp = roomRef.current?.localParticipant
    if (!lp) return
    await lp.setMicrophoneEnabled(!lp.isMicrophoneEnabled)
    setState((prev) => ({ ...prev, isMicOn: lp.isMicrophoneEnabled }))
  }, [])

  const toggleScreenShare = useCallback(async () => {
    const lp = roomRef.current?.localParticipant
    if (!lp) return
    await lp.setScreenShareEnabled(!lp.isScreenShareEnabled)
    setState((prev) => ({ ...prev, isScreenSharing: lp.isScreenShareEnabled }))
  }, [])

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect()
    }
  }, [])

  return { ...state, connect, disconnect, toggleCamera, toggleMic, toggleScreenShare }
}
