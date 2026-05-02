import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Необходима авторизация' })
  }
}

export async function optionalAuth(request: FastifyRequest) {
  try {
    await request.jwtVerify()
  } catch {
    // not authenticated — that's fine
  }
}
