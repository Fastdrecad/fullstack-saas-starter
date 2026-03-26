import { type Request, type Response, type NextFunction } from 'express'
import { redis } from '../config/redis.js'
import { logger } from '../lib/logger.js'
import { rateLimited } from '../lib/errors.js'

type RateLimiterOptions = {
  windowMs: number
  max: number
  keyGenerator: (req: Request) => string
}

export const createRateLimiter = ({ windowMs, max, keyGenerator }: RateLimiterOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis) {
      return next()
    }

    const key = `rateLimit:${keyGenerator(req)}`
    const windowSecs = Math.ceil(windowMs / 1000)

    try {
      const current = await redis.incr(key)

      if (current === 1) {
        await redis.expire(key, windowSecs)
      }

      const ttl = await redis.ttl(key)
      const remaining = Math.max(0, max - current)

      res.setHeader('X-RateLimit-Limit', max)
      res.setHeader('X-RateLimit-Remaining', remaining)
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl)

      if (current > max) {
        res.setHeader('Retry-After', ttl)
        return next(rateLimited())
      }

      next()
    } catch (err) {
      logger.warn(err, 'Rate limiter Redis error — allowing request')
      next()
    }
  }
}
