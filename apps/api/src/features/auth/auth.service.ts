import crypto from 'node:crypto'
import { type PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { type RegisterInput, type LoginInput } from '@starter/shared'
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../../lib/tokens.js'
import { conflict, unauthorized, notFound } from '../../lib/errors.js'
import { logger } from '../../lib/logger.js'

const SALT_ROUNDS = 12

type AuthServiceDeps = {
  db: PrismaClient
}

export const createAuthService = ({ db }: AuthServiceDeps) => {
  const issueTokens = async (user: { id: string; role: string }) => {
    const accessToken = generateAccessToken(user.id, user.role)
    const { token: refreshToken, jti } = generateRefreshToken(user.id)

    await db.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return { accessToken, refreshToken }
  }

  const register = async (input: RegisterInput) => {
    const existing = await db.user.findUnique({
      where: { email: input.email },
    })

    if (existing) {
      throw conflict('Email already in use')
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
      },
    })

    const tokens = await issueTokens(user)

    return {
      ...tokens,
      user: toUserResponse(user),
    }
  }

  const login = async (input: LoginInput) => {
    const user = await db.user.findUnique({
      where: { email: input.email },
    })

    if (!user?.passwordHash) {
      throw unauthorized('Invalid email or password')
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash)

    if (!isValid) {
      throw unauthorized('Invalid email or password')
    }

    const tokens = await issueTokens(user)

    return {
      ...tokens,
      user: toUserResponse(user),
    }
  }

  const getMe = async (userId: string) => {
    const user = await db.user.findUnique({
      where: { id: userId, deletedAt: null },
    })

    if (!user) {
      throw notFound('User')
    }

    return toUserResponse(user)
  }

  const refresh = async (rawToken: string) => {
    // 1. Verify JWT signature and extract payload
    let payload: { sub: string; jti: string }
    try {
      payload = verifyRefreshToken(rawToken)
    } catch {
      throw unauthorized('Invalid refresh token')
    }

    // 2. Find token record in DB by jti
    const storedToken = await db.refreshToken.findUnique({
      where: { id: payload.jti },
    })

    // 3. Reuse detection — token already revoked means compromise
    if (storedToken?.revokedAt) {
      logger.warn({ userId: payload.sub }, 'Refresh token reuse detected — revoking all tokens')
      await db.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      throw unauthorized('Token reuse detected')
    }

    // 4. Token not found or hash mismatch
    if (!storedToken || storedToken.tokenHash !== hashToken(rawToken)) {
      throw unauthorized('Invalid refresh token')
    }

    // 5. Check expiry
    if (storedToken.expiresAt < new Date()) {
      throw unauthorized('Refresh token expired')
    }

    // 6. Revoke old token
    await db.refreshToken.update({
      where: { id: payload.jti },
      data: { revokedAt: new Date() },
    })

    // 7. Find user and issue new tokens
    const user = await db.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
    })

    if (!user) {
      throw unauthorized('User not found')
    }

    const tokens = await issueTokens(user)

    return {
      ...tokens,
      user: toUserResponse(user),
    }
  }

  const logout = async (rawToken: string) => {
    try {
      const payload = verifyRefreshToken(rawToken)

      await db.refreshToken.update({
        where: { id: payload.jti },
        data: { revokedAt: new Date() },
      })
    } catch {
      // Silently ignore — logout should never fail
    }
  }

  const forgotPassword = async (email: string) => {
    const user = await db.user.findUnique({ where: { email } })

    // Always return success — no email enumeration
    if (!user) return

    // Generate random token and store hash
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    return { token: rawToken, email: user.email }
  }

  const resetPassword = async (rawToken: string, newPassword: string) => {
    const tokenHash = hashToken(rawToken)

    const resetToken = await db.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
    })

    if (!resetToken) {
      throw unauthorized('Invalid or expired reset token')
    }

    if (resetToken.expiresAt < new Date()) {
      throw unauthorized('Reset token has expired')
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await db.$transaction([
      // Update password
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      // Mark token as used
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens (force re-login)
      db.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])
  }

  return { register, login, getMe, refresh, logout, forgotPassword, resetPassword }
}

const toUserResponse = (user: {
  id: string
  email: string
  displayName: string
  role: string
  locale: string
  preferredTheme: string
}) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  locale: user.locale,
  preferredTheme: user.preferredTheme,
})

export type AuthService = ReturnType<typeof createAuthService>
