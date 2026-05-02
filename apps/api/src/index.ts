import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { config } from './config'
import { db } from './db'
import { redis } from './redis'
import { authRoutes } from './routes/auth'
import { meRoutes } from './routes/me'
import { roomRoutes } from './routes/rooms'
import { createSocketServer } from './ws/socketHandler'

const app = Fastify({ logger: { level: config.NODE_ENV === 'development' ? 'info' : 'warn' } })

async function bootstrap() {
  const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:3000',
    'https://po-zvoni.ru',
    'https://www.po-zvoni.ru',
  ].filter(Boolean)

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  })

  await app.register(fastifyCookie)

  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: 'token', signed: false },
  })

  app.addHook('onRequest', async (request) => {
    const auth = request.headers.authorization
    if (auth?.startsWith('Bearer ') && !request.cookies['token']) {
      request.headers['cookie'] = `token=${auth.slice(7)}`
    }
  })

  await app.register(authRoutes)
  await app.register(meRoutes)
  await app.register(roomRoutes)

  app.get('/api/health', async () => ({ ok: true, ts: new Date().toISOString() }))

  await redis.connect()

  // Важно: app.listen() должен быть ДО createSocketServer,
  // чтобы Socket.io правильно обернул request-листенеры Fastify
  await app.listen({ port: config.API_PORT, host: '0.0.0.0' })
  createSocketServer(app.server)
  console.log(`🚀 API server running on port ${config.API_PORT}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  await db.$disconnect()
  await redis.quit()
  await app.close()
  process.exit(0)
})
