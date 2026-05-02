import Redis from 'ioredis'
import { config } from './config'

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
})

redis.on('error', (err) => {
  console.error('[Redis] error:', err.message)
})
