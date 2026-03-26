import { describe, it, expect } from 'vitest'
import supertest from 'supertest'
import { createApp } from '../app.js'
import { redis } from '../config/redis.js'
import '../test/setup.js'

const app = createApp()
const request = supertest(app)

const isRedisAvailable = redis !== null

describe('rate limiter', () => {
  describe.skipIf(!isRedisAvailable)('login rate limiting', () => {
    it('allows requests under the limit', async () => {
      const res = await request.post('/api/v1/auth/login').send({
        email: 'ratelimit@test.com',
        password: 'StrongPass1',
      })

      // 401 because user doesn't exist, but NOT 429
      expect(res.status).toBe(401)
      expect(res.headers['x-ratelimit-limit']).toBe('10')
      expect(res.headers['x-ratelimit-remaining']).toBeDefined()
    })

    it('returns 429 after exceeding limit', async () => {
      const email = `brute-${Date.now()}@test.com`

      // Send 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await request.post('/api/v1/auth/login').send({
          email,
          password: 'WrongPass1',
        })
      }

      // 11th request should be rate limited
      const res = await request.post('/api/v1/auth/login').send({
        email,
        password: 'WrongPass1',
      })

      expect(res.status).toBe(429)
      expect(res.body.error.code).toBe('RATE_LIMITED')
      expect(res.headers['retry-after']).toBeDefined()
    })
  })

  describe.skipIf(!isRedisAvailable)('register rate limiting', () => {
    it('returns 429 after exceeding register limit', async () => {
      // Send 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request.post('/api/v1/auth/register').send({
          email: `reg-${Date.now()}-${i}@test.com`,
          password: 'StrongPass1',
          displayName: `User ${i}`,
        })
      }

      // 6th request should be rate limited
      const res = await request.post('/api/v1/auth/register').send({
        email: `reg-blocked@test.com`,
        password: 'StrongPass1',
        displayName: 'Blocked User',
      })

      expect(res.status).toBe(429)
    })
  })
})
