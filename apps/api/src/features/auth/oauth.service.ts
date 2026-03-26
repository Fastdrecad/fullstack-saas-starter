import crypto from 'node:crypto'
import { type PrismaClient } from '@prisma/client'
import { env } from '../../config/env.js'
import { generateAccessToken, generateRefreshToken, hashToken } from '../../lib/tokens.js'
import { logger } from '../../lib/logger.js'

// ─── GitHub ──────────────────────────────────────────────────────────────────

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails'

type GitHubUser = { id: number; login: string; name: string | null; avatar_url: string }
type GitHubEmail = { email: string; primary: boolean; verified: boolean }

// ─── Google ──────────────────────────────────────────────────────────────────

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

type GoogleUserInfo = {
  id: string
  email: string
  verified_email: boolean
  name: string
  picture: string
}

// ─── Shared types ────────────────────────────────────────────────────────────

type OAuthProfile = {
  provider: 'github' | 'google'
  providerId: string
  email: string
  displayName: string
  avatarUrl: string | null
}

type OAuthServiceDeps = {
  db: PrismaClient
}

export const createOAuthService = ({ db }: OAuthServiceDeps) => {
  // ─── Shared: find-or-create user + issue tokens ────────────────────────

  const findOrCreateUser = async (profile: OAuthProfile) => {
    const existingOAuth = await db.oauthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: { user: true },
    })

    if (existingOAuth) {
      return existingOAuth.user
    }

    const existingUser = await db.user.findUnique({
      where: { email: profile.email },
    })

    if (existingUser) {
      await db.oauthAccount.create({
        data: {
          userId: existingUser.id,
          provider: profile.provider,
          providerId: profile.providerId,
          email: profile.email,
        },
      })
      return existingUser
    }

    return db.user.create({
      data: {
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        emailVerified: true,
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
          },
        },
      },
    })
  }

  const issueTokensForUser = async (user: { id: string; role: string }) => {
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

  // ─── GitHub ────────────────────────────────────────────────────────────

  const getGitHubAuthUrl = () => {
    if (!env.GITHUB_CLIENT_ID) {
      throw new Error('GITHUB_CLIENT_ID not configured')
    }

    const state = crypto.randomBytes(32).toString('hex')
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: `${env.CLIENT_URL}/auth/github/callback`,
      scope: 'read:user user:email',
      state,
    })

    return { url: `${GITHUB_AUTHORIZE_URL}?${params.toString()}`, state }
  }

  const handleGitHubCallback = async (code: string) => {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub OAuth not configured')
    }

    // Exchange code for token
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      logger.error({ error: tokenData.error }, 'GitHub token exchange failed')
      throw new Error('GitHub token exchange failed')
    }

    // Fetch user profile + emails
    const [userRes, emailsRes] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
      fetch(GITHUB_EMAILS_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
    ])

    const ghUser = (await userRes.json()) as GitHubUser
    const ghEmails = (await emailsRes.json()) as GitHubEmail[]
    const primaryEmail = ghEmails.find((e) => e.primary && e.verified)

    if (!primaryEmail) {
      throw new Error('No verified primary email from GitHub')
    }

    const user = await findOrCreateUser({
      provider: 'github',
      providerId: String(ghUser.id),
      email: primaryEmail.email,
      displayName: ghUser.name ?? ghUser.login,
      avatarUrl: ghUser.avatar_url,
    })

    return issueTokensForUser(user)
  }

  // ─── Google ────────────────────────────────────────────────────────────

  const getGoogleAuthUrl = () => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID not configured')
    }

    const state = crypto.randomBytes(32).toString('hex')
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.CLIENT_URL}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      state,
    })

    return { url: `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`, state }
  }

  const handleGoogleCallback = async (code: string) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth not configured')
    }

    // Exchange code for token (Google uses form-urlencoded)
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.CLIENT_URL}/auth/google/callback`,
      }),
    })

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      logger.error({ error: tokenData.error }, 'Google token exchange failed')
      throw new Error('Google token exchange failed')
    }

    // Fetch user info (single endpoint, email included)
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = (await userRes.json()) as GoogleUserInfo

    if (!googleUser.verified_email) {
      throw new Error('Google email not verified')
    }

    const user = await findOrCreateUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
    })

    return issueTokensForUser(user)
  }

  return {
    getGitHubAuthUrl,
    handleGitHubCallback,
    getGoogleAuthUrl,
    handleGoogleCallback,
  }
}

export type OAuthService = ReturnType<typeof createOAuthService>
