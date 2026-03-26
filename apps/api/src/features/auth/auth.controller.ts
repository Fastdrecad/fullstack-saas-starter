import { type AuthService } from './auth.service.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { unauthorized } from '../../lib/errors.js'
import { sendPasswordResetEmail } from '../../lib/email.js'
import { env } from '../../config/env.js'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const createAuthController = (authService: AuthService) => ({
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body)

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

    res.status(201).json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

    res.json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()

    const user = await authService.getMe(req.user.id)

    res.json({ data: user })
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken as string | undefined

    if (!token) {
      throw unauthorized('Missing refresh token')
    }

    const result = await authService.refresh(token)

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

    res.json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken as string | undefined

    if (token) {
      await authService.logout(token)
    }

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
    res.status(204).end()
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email)

    if (result) {
      await sendPasswordResetEmail(result.email, result.token)
    }

    // Always return 200 — no email enumeration
    res.json({ data: { message: 'If the email exists, a reset link has been sent' } })
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword)

    res.json({ data: { message: 'Password has been reset successfully' } })
  }),
})
