import { Redis } from 'ioredis'
import { env } from './env.js'
import { logger } from '../lib/logger.js'

const createRedisClient = (): Redis | null => {
  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL not set — rate limiting disabled')
    return null
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
  })

  client.on('error', (err: Error) => {
    logger.error(err, 'Redis connection error')
  })

  client.on('connect', () => {
    logger.info('Redis connected')
  })

  return client
}

export const redis = createRedisClient()
