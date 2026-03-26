import { Router } from 'express'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@starter/shared'
import { validate } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { createRateLimiter } from '../../middleware/rateLimiter.js'
import { type createAuthController } from './auth.controller.js'
import { type createOAuthController } from './oauth.controller.js'

type AuthController = ReturnType<typeof createAuthController>
type OAuthController = ReturnType<typeof createOAuthController>

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `login:${req.ip}:${req.body?.email ?? 'unknown'}`,
})

const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `register:${req.ip}`,
})

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `forgot:${req.body?.email ?? req.ip}`,
})

export const createAuthRoutes = (
  authController: AuthController,
  oauthController: OAuthController,
): Router => {
  const router = Router()

  router.post('/register', registerLimiter, validate(registerSchema), authController.register)
  router.post('/login', loginLimiter, validate(loginSchema), authController.login)
  router.post('/refresh', authController.refresh)
  router.post('/logout', authController.logout)
  router.post(
    '/forgot-password',
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword,
  )
  router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)
  router.get('/me', requireAuth, authController.me)

  // OAuth
  router.get('/github', oauthController.githubRedirect)
  router.get('/github/callback', oauthController.githubCallback)
  router.get('/google', oauthController.googleRedirect)
  router.get('/google/callback', oauthController.googleCallback)

  return router
}
