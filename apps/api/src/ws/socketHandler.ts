import { Server as SocketServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { db } from '../db'
import { config } from '../config'

interface JoinPayload {
  roomId: string
  participantId: string
  participantName: string
  isGuest: boolean
}

interface ChatPayload {
  roomId: string
  text: string
  participantId: string
  participantName: string
  isGuest: boolean
}

interface TranscriptionStatusPayload {
  roomId: string
  status: 'active' | 'stopped'
}

export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    let currentRoom: string | null = null
    let currentParticipant: { id: string; name: string; isGuest: boolean } | null = null

    socket.on('room:join', async (payload: JoinPayload) => {
      const { roomId, participantId, participantName, isGuest } = payload
      currentRoom = roomId
      currentParticipant = { id: participantId, name: participantName, isGuest }

      await socket.join(roomId)

      // Notify others
      socket.to(roomId).emit('room:participant_joined', {
        participantId,
        participantName,
        isGuest,
      })

      // Send system message to chat
      const sysMsg = await db.chatMessage.create({
        data: {
          roomId,
          text: `${participantName} присоединился к звонку`,
          type: 'SYSTEM',
          senderUserId: isGuest ? null : participantId,
          senderGuestId: isGuest ? participantId : null,
        },
      })
      io.to(roomId).emit('chat:message', formatMessage(sysMsg, participantName))
    })

    socket.on('chat:send', async (payload: ChatPayload) => {
      const { roomId, text, participantId, participantName, isGuest } = payload
      if (!text?.trim()) return

      const msg = await db.chatMessage.create({
        data: {
          roomId,
          text: text.trim(),
          type: 'USER',
          senderUserId: isGuest ? null : participantId,
          senderGuestId: isGuest ? participantId : null,
        },
      })

      io.to(roomId).emit('chat:message', {
        id: msg.id,
        text: msg.text,
        type: msg.type,
        createdAt: msg.createdAt,
        senderName: participantName,
        senderId: participantId,
        isGuest,
      })
    })

    socket.on('room:transcription_status', (payload: TranscriptionStatusPayload) => {
      const { roomId, status } = payload
      io.to(roomId).emit('room:transcription_status', { status })
    })

    socket.on('disconnect', async () => {
      if (!currentRoom || !currentParticipant) return

      socket.to(currentRoom).emit('room:participant_left', {
        participantId: currentParticipant.id,
        participantName: currentParticipant.name,
      })

      const sysMsg = await db.chatMessage.create({
        data: {
          roomId: currentRoom,
          text: `${currentParticipant.name} покинул звонок`,
          type: 'SYSTEM',
          senderUserId: currentParticipant.isGuest ? null : currentParticipant.id,
          senderGuestId: currentParticipant.isGuest ? currentParticipant.id : null,
        },
      })
      io.to(currentRoom).emit('chat:message', formatMessage(sysMsg, currentParticipant.name))
    })
  })

  return io
}

function formatMessage(msg: { id: string; text: string; type: string; createdAt: Date }, senderName: string) {
  return {
    id: msg.id,
    text: msg.text,
    type: msg.type,
    createdAt: msg.createdAt,
    senderName,
    senderId: null,
    isGuest: false,
  }
}
