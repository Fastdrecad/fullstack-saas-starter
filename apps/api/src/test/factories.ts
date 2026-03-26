import bcrypt from 'bcryptjs'
import { prisma } from './setup.js'

let counter = 0
const unique = () => ++counter

export const createUser = async (
  overrides: Partial<{
    email: string
    passwordHash: string
    displayName: string
    role: string
  }> = {},
) => {
  const id = unique()
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user${id}@test.com`,
      passwordHash: overrides.passwordHash ?? (await bcrypt.hash('TestPass1', 4)),
      displayName: overrides.displayName ?? `Test User ${id}`,
      role: overrides.role ?? 'user',
    },
  })
}
