import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, afterEach } from 'vitest'
import { redis } from '../config/redis.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required for tests')

const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({ adapter })

afterEach(async () => {
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.oauthAccount.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // Clean rate limit keys between tests
  if (redis) {
    const keys = await redis.keys('rateLimit:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
})

afterAll(async () => {
  await prisma.$disconnect()
  if (redis) {
    await redis.quit()
  }
})

export { prisma }
