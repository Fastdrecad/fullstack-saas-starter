import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env.js'

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

  const client = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

  return client
}

// Singleton — reuse the same client across the app
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
