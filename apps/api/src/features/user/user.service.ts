import { type PrismaClient } from '@prisma/client'
import { notFound, createAppError } from '../../lib/errors.js'

type UserServiceDeps = {
  db: PrismaClient
}

export const createUserService = ({ db }: UserServiceDeps) => {
  const getLinkedOAuthAccounts = async (userId: string) => {
    const accounts = await db.oauthAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        email: true,
        createdAt: true,
      },
    })

    return accounts
  }

  const unlinkOAuthAccount = async (userId: string, provider: string) => {
    // Check the account exists
    const account = await db.oauthAccount.findFirst({
      where: { userId, provider },
    })

    if (!account) {
      throw notFound('OAuth account')
    }

    // Check if user has another auth method
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    })

    if (!user) {
      throw notFound('User')
    }

    const hasPassword = Boolean(user.passwordHash)
    const otherOAuthCount = user.oauthAccounts.filter((a) => a.provider !== provider).length

    if (!hasPassword && otherOAuthCount === 0) {
      throw createAppError(
        'VALIDATION',
        'Cannot unlink the only authentication method. Set a password first.',
        400,
      )
    }

    await db.oauthAccount.delete({
      where: { id: account.id },
    })
  }

  return { getLinkedOAuthAccounts, unlinkOAuthAccount }
}

export type UserService = ReturnType<typeof createUserService>
