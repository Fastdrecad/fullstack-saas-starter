import { type OAuthService } from './oauth.service.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 10 * 60 * 1000,
}

const handleOAuthRedirect = (getAuthUrl: () => { url: string; state: string }) =>
  asyncHandler(async (_req, res) => {
    const { url, state } = getAuthUrl()
    res.cookie('oauth_state', state, STATE_COOKIE_OPTIONS)
    res.redirect(url)
  })

const handleOAuthCallback = (
  provider: string,
  handleCallback: (code: string) => Promise<{ accessToken: string; refreshToken: string }>,
) =>
  asyncHandler(async (req, res) => {
    const code = req.query.code as string | undefined
    const state = req.query.state as string | undefined
    const storedState = req.cookies?.oauth_state as string | undefined

    if (!code || !state || !storedState || state !== storedState) {
      logger.warn(`${provider} OAuth state mismatch or missing params`)
      return res.redirect(`${env.CLIENT_URL}/auth/error?reason=invalid_state`)
    }

    res.clearCookie('oauth_state', STATE_COOKIE_OPTIONS)

    try {
      const result = await handleCallback(code)
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)
      res.redirect(`${env.CLIENT_URL}/auth/callback?token=${result.accessToken}`)
    } catch (err) {
      logger.error(err, `${provider} OAuth callback failed`)
      res.redirect(`${env.CLIENT_URL}/auth/error?reason=oauth_failed`)
    }
  })

export const createOAuthController = (oauthService: OAuthService) => ({
  githubRedirect: handleOAuthRedirect(() => oauthService.getGitHubAuthUrl()),
  githubCallback: handleOAuthCallback('GitHub', (code) => oauthService.handleGitHubCallback(code)),
  googleRedirect: handleOAuthRedirect(() => oauthService.getGoogleAuthUrl()),
  googleCallback: handleOAuthCallback('Google', (code) => oauthService.handleGoogleCallback(code)),
})
