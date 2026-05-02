import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { getLiveKitToken } from '../providers/media/LiveKitMediaProvider'
import { MockTranscriptionProvider } from '../providers/transcription/MockTranscriptionProvider'
import { MockAISummaryProvider } from '../providers/ai/MockAISummaryProvider'

const transcription = new MockTranscriptionProvider()
const aiSummary = new MockAISummaryProvider()

export async function roomRoutes(app: FastifyInstance) {
  // Create room
  app.post('/api/rooms', { preHandler: requireAuth }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const { title } = (request.body as { title?: string }) ?? {}

    const slug = nanoid(10)
    const room = await db.room.create({
      data: {
        slug,
        ownerUserId: userId,
        title: title ?? 'Без названия',
        inviteLinks: {
          create: { token: nanoid(16) },
        },
      },
      include: { inviteLinks: true },
    })

    return reply.code(201).send(room)
  })

  // Get room by id or slug
  app.get('/api/rooms/:roomId', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const room = await db.room.findFirst({
      where: { OR: [{ id: roomId }, { slug: roomId }] },
      include: {
        inviteLinks: { take: 1 },
        _count: { select: { participants: { where: { leftAt: null } } } },
      },
    })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })
    return reply.send(room)
  })

  // Resolve invite link → redirect to room
  app.get('/api/join/:token', async (request, reply) => {
    const { token } = request.params as { token: string }
    const link = await db.inviteLink.findUnique({
      where: { token },
      include: { room: true },
    })
    if (!link) return reply.code(404).send({ error: 'Ссылка не найдена или устарела' })
    if (link.expiresAt && link.expiresAt < new Date()) {
      return reply.code(410).send({ error: 'Ссылка истекла' })
    }
    return reply.send({ roomId: link.room.id, roomSlug: link.room.slug, title: link.room.title })
  })

  // Join room (returns LiveKit token)
  app.post('/api/rooms/:roomId/join', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const body = (request.body as { guestName?: string }) ?? {}

    const room = await db.room.findFirst({
      where: { OR: [{ id: roomId }, { slug: roomId }] },
    })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })
    if (room.status === 'ENDED') return reply.code(410).send({ error: 'Звонок завершён' })

    const authUser = request.user as { sub: string; email: string } | undefined

    if (authUser) {
      const user = await db.user.findUnique({ where: { id: authUser.sub } })
      if (!user) return reply.code(401).send({ error: 'Пользователь не найден' })

      await db.roomParticipant.upsert({
        where: {
          id: (await db.roomParticipant.findFirst({ where: { roomId: room.id, userId: user.id } }))?.id ?? '',
        },
        update: { joinedAt: new Date(), leftAt: null },
        create: {
          roomId: room.id,
          userId: user.id,
          role: room.ownerUserId === user.id ? 'HOST' : 'PARTICIPANT',
        },
      })

      const token = await getLiveKitToken(room.id, user.id, user.name, {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      })
      return reply.send({ token, participantId: user.id, participantName: user.name, isGuest: false })
    }

    // Guest join
    if (!body.guestName?.trim()) {
      return reply.code(400).send({ error: 'Введите имя для входа как гость' })
    }

    const guest = await db.guestSession.create({
      data: { displayName: body.guestName.trim(), roomId: room.id },
    })
    await db.roomParticipant.create({
      data: { roomId: room.id, guestSessionId: guest.id, role: 'PARTICIPANT' },
    })

    const token = await getLiveKitToken(room.id, guest.id, guest.displayName, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    return reply.send({ token, participantId: guest.id, participantName: guest.displayName, isGuest: true })
  })

  // Leave room
  app.post('/api/rooms/:roomId/leave', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const body = (request.body as { participantId?: string }) ?? {}
    const authUser = request.user as { sub: string } | undefined

    if (authUser) {
      await db.roomParticipant.updateMany({
        where: { roomId, userId: authUser.sub, leftAt: null },
        data: { leftAt: new Date() },
      })
    } else if (body.participantId) {
      await db.roomParticipant.updateMany({
        where: { roomId, guestSessionId: body.participantId, leftAt: null },
        data: { leftAt: new Date() },
      })
    }
    return reply.send({ ok: true })
  })

  // Create invite link
  app.post('/api/rooms/:roomId/invite', { preHandler: requireAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const userId = (request.user as { sub: string }).sub
    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })
    if (room.ownerUserId !== userId) return reply.code(403).send({ error: 'Нет прав' })

    const link = await db.inviteLink.create({
      data: { roomId: room.id, token: nanoid(16) },
    })
    return reply.code(201).send(link)
  })

  // Get messages
  app.get('/api/rooms/:roomId/messages', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const messages = await db.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true, text: true, type: true, createdAt: true,
        senderUser: { select: { id: true, name: true } },
        senderGuest: { select: { id: true, displayName: true } },
      },
    })
    return reply.send(messages)
  })

  // Post message (HTTP fallback — primary is socket)
  app.post('/api/rooms/:roomId/messages', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const { text, guestSessionId } = request.body as { text: string; guestSessionId?: string }
    const authUser = request.user as { sub: string } | undefined

    if (!text?.trim()) return reply.code(400).send({ error: 'Пустое сообщение' })

    const msg = await db.chatMessage.create({
      data: {
        roomId,
        text: text.trim(),
        senderUserId: authUser?.sub ?? null,
        senderGuestId: guestSessionId ?? null,
      },
      select: {
        id: true, text: true, type: true, createdAt: true,
        senderUser: { select: { id: true, name: true } },
        senderGuest: { select: { id: true, displayName: true } },
      },
    })
    return reply.code(201).send(msg)
  })

  // Get LiveKit media token (re-issue)
  app.post('/api/rooms/:roomId/media-token', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const body = (request.body as { participantId?: string; participantName?: string }) ?? {}
    const authUser = request.user as { sub: string; email: string } | undefined

    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })

    let pid: string, pname: string
    if (authUser) {
      const user = await db.user.findUnique({ where: { id: authUser.sub } })
      if (!user) return reply.code(401).send({ error: 'Пользователь не найден' })
      pid = user.id
      pname = user.name
    } else {
      if (!body.participantId || !body.participantName) {
        return reply.code(400).send({ error: 'Требуются participantId и participantName' })
      }
      pid = body.participantId
      pname = body.participantName
    }

    const token = await getLiveKitToken(room.id, pid, pname, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    return reply.send({ token })
  })

  // Start transcription
  app.post('/api/rooms/:roomId/transcription/start', { preHandler: requireAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })

    const result = await transcription.start(room.id)
    return reply.send(result)
  })

  // Stop transcription
  app.post('/api/rooms/:roomId/transcription/stop', { preHandler: requireAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })

    const result = await transcription.stop(room.id)
    return reply.send(result)
  })

  // End room
  app.post('/api/rooms/:roomId/end', { preHandler: requireAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const userId = (request.user as { sub: string }).sub
    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })
    if (room.ownerUserId !== userId) return reply.code(403).send({ error: 'Нет прав' })

    await db.room.update({ where: { id: room.id }, data: { status: 'ENDED', endedAt: new Date() } })
    return reply.send({ ok: true })
  })

  // Get summary
  app.get('/api/rooms/:roomId/summary', { preHandler: optionalAuth }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string }
    const room = await db.room.findFirst({ where: { OR: [{ id: roomId }, { slug: roomId }] } })
    if (!room) return reply.code(404).send({ error: 'Комната не найдена' })

    const summary = await aiSummary.getSummary(room.id)
    return reply.send(summary)
  })
}
