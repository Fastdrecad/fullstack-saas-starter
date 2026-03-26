import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { prisma } from '../../test/setup.js'
import { createAuthService } from './auth.service.js'

const authService = createAuthService({ db: prisma })

describe('authService.register', () => {
  it('creates a user and returns tokens', async () => {
    const result = await authService.register({
      email: 'new@test.com',
      password: 'StrongPass1',
      displayName: 'New User',
    })

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.user.email).toBe('new@test.com')
    expect(result.user.displayName).toBe('New User')
    expect(result.user.role).toBe('user')
  })

  it('hashes the password before storing', async () => {
    await authService.register({
      email: 'hash@test.com',
      password: 'StrongPass1',
      displayName: 'Hash User',
    })

    const user = await prisma.user.findUnique({
      where: { email: 'hash@test.com' },
    })

    expect(user).toBeDefined()
    expect(user?.passwordHash).not.toBe('StrongPass1')
    const isValid = await bcrypt.compare('StrongPass1', user?.passwordHash ?? '')
    expect(isValid).toBe(true)
  })

  it('stores refresh token hash in database', async () => {
    const result = await authService.register({
      email: 'token@test.com',
      password: 'StrongPass1',
      displayName: 'Token User',
    })

    const tokens = await prisma.refreshToken.findMany({
      where: { userId: result.user.id },
    })

    expect(tokens).toHaveLength(1)
    const token = tokens[0]
    expect(token).toBeDefined()
    expect(token?.tokenHash).toBeDefined()
    expect(token?.tokenHash).not.toBe(result.refreshToken)
  })

  it('throws conflict error for duplicate email', async () => {
    await authService.register({
      email: 'dupe@test.com',
      password: 'StrongPass1',
      displayName: 'First User',
    })

    await expect(
      authService.register({
        email: 'dupe@test.com',
        password: 'StrongPass1',
        displayName: 'Second User',
      }),
    ).rejects.toThrow('Email already in use')
  })

  it('does not return password hash in user object', async () => {
    const result = await authService.register({
      email: 'safe@test.com',
      password: 'StrongPass1',
      displayName: 'Safe User',
    })

    expect(result.user).not.toHaveProperty('passwordHash')
  })
})

describe('authService.login', () => {
  it('returns tokens for valid credentials', async () => {
    await authService.register({
      email: 'login@test.com',
      password: 'StrongPass1',
      displayName: 'Login User',
    })

    const result = await authService.login({
      email: 'login@test.com',
      password: 'StrongPass1',
    })

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.user.email).toBe('login@test.com')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws unauthorized for wrong password', async () => {
    await authService.register({
      email: 'wrongpass@test.com',
      password: 'StrongPass1',
      displayName: 'Wrong Pass',
    })

    await expect(
      authService.login({ email: 'wrongpass@test.com', password: 'WrongPass1' }),
    ).rejects.toThrow('Invalid email or password')
  })

  it('throws unauthorized for unknown email', async () => {
    await expect(
      authService.login({ email: 'nobody@test.com', password: 'StrongPass1' }),
    ).rejects.toThrow('Invalid email or password')
  })
})

describe('authService.refresh', () => {
  it('returns new tokens for valid refresh token', async () => {
    const registerResult = await authService.register({
      email: 'refresh@test.com',
      password: 'StrongPass1',
      displayName: 'Refresh User',
    })

    const result = await authService.refresh(registerResult.refreshToken)

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.refreshToken).not.toBe(registerResult.refreshToken)
    expect(result.user.email).toBe('refresh@test.com')
  })

  it('revokes old token after refresh', async () => {
    const registerResult = await authService.register({
      email: 'revoke@test.com',
      password: 'StrongPass1',
      displayName: 'Revoke User',
    })

    await authService.refresh(registerResult.refreshToken)

    await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
      'Token reuse detected',
    )
  })

  it('revokes ALL tokens on reuse detection', async () => {
    const registerResult = await authService.register({
      email: 'reuse@test.com',
      password: 'StrongPass1',
      displayName: 'Reuse User',
    })

    // Get a new token via refresh
    const refreshResult = await authService.refresh(registerResult.refreshToken)

    // Reuse the OLD token — triggers reuse detection
    await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
      'Token reuse detected',
    )

    // Even the NEW token should now be revoked
    await expect(authService.refresh(refreshResult.refreshToken)).rejects.toThrow(
      'Token reuse detected',
    )
  })

  it('throws for invalid token', async () => {
    await expect(authService.refresh('invalid.token.here')).rejects.toThrow('Invalid refresh token')
  })
})

describe('authService.forgotPassword', () => {
  it('generates token and stores hash in DB', async () => {
    await authService.register({
      email: 'forgot@test.com',
      password: 'StrongPass1',
      displayName: 'Forgot User',
    })

    const result = await authService.forgotPassword('forgot@test.com')

    expect(result).toBeDefined()
    expect(result?.token).toHaveLength(64) // 32 bytes hex
    expect(result?.email).toBe('forgot@test.com')

    const tokens = await prisma.passwordResetToken.findMany({
      where: { user: { email: 'forgot@test.com' } },
    })
    expect(tokens).toHaveLength(1)
  })

  it('returns undefined for unknown email', async () => {
    const result = await authService.forgotPassword('nobody@test.com')
    expect(result).toBeUndefined()
  })
})

describe('authService.resetPassword', () => {
  it('updates password and revokes all refresh tokens', async () => {
    const registerResult = await authService.register({
      email: 'reset@test.com',
      password: 'OldPass123',
      displayName: 'Reset User',
    })

    const forgotResult = await authService.forgotPassword('reset@test.com')

    await authService.resetPassword(forgotResult?.token ?? '', 'NewPass123')

    // Can login with new password
    const loginResult = await authService.login({
      email: 'reset@test.com',
      password: 'NewPass123',
    })
    expect(loginResult.accessToken).toBeDefined()

    // Old refresh token should be revoked
    await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow()
  })

  it('throws for invalid token', async () => {
    await expect(authService.resetPassword('invalid', 'NewPass123')).rejects.toThrow(
      'Invalid or expired reset token',
    )
  })

  it('throws for already-used token', async () => {
    await authService.register({
      email: 'used@test.com',
      password: 'OldPass123',
      displayName: 'Used Token',
    })

    const forgotResult = await authService.forgotPassword('used@test.com')
    await authService.resetPassword(forgotResult?.token ?? '', 'NewPass123')

    await expect(
      authService.resetPassword(forgotResult?.token ?? '', 'AnotherPass1'),
    ).rejects.toThrow('Invalid or expired reset token')
  })
})
