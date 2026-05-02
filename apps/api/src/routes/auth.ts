import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(60),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Неверные данные', details: body.error.flatten() })
    }
    const { email, name, password } = body.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return reply.code(409).send({ error: 'Пользователь с таким email уже существует' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { email, name, password: hashed },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    })

    const token = app.jwt.sign({ sub: user.id, email: user.email })
    reply.setCookie('token', token, cookieOptions())
    return reply.code(201).send({ user, token })
  })

  app.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) {
      return reply.code(400).send({ error: 'Неверные данные' })
    }
    const { email, password } = body.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return reply.code(401).send({ error: 'Неверный email или пароль' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.code(401).send({ error: 'Неверный email или пароль' })
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email })
    reply.setCookie('token', token, cookieOptions())
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
      token,
    })
  })

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('token')
    return reply.send({ ok: true })
  })
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  }
}
