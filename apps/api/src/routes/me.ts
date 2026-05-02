import { FastifyInstance } from 'fastify'
import { db } from '../db'
import { requireAuth } from '../middleware/auth'

export async function meRoutes(app: FastifyInstance) {
  app.get('/api/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    })
    if (!user) return reply.code(404).send({ error: 'Пользователь не найден' })
    return reply.send(user)
  })

  app.get('/api/me/rooms', { preHandler: requireAuth }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const rooms = await db.room.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, slug: true, title: true, status: true, createdAt: true, endedAt: true,
        _count: { select: { participants: true } },
      },
    })
    return reply.send(rooms)
  })

  app.patch('/api/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const { name } = request.body as { name?: string }
    if (name && (name.length < 2 || name.length > 60)) {
      return reply.code(400).send({ error: 'Имя должно быть от 2 до 60 символов' })
    }
    const user = await db.user.update({
      where: { id: userId },
      data: { ...(name && { name }) },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    })
    return reply.send(user)
  })

  app.put('/api/me/devices', { preHandler: requireAuth }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub
    const { microphoneId, cameraId, speakerId } = request.body as {
      microphoneId?: string
      cameraId?: string
      speakerId?: string
    }
    const prefs = await db.devicePreference.upsert({
      where: { userId },
      update: { microphoneId, cameraId, speakerId },
      create: { userId, microphoneId, cameraId, speakerId },
    })
    return reply.send(prefs)
  })
}
