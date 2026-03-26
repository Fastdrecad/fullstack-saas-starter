import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

type AccessTokenPayload = {
  sub: string
  role: string
}

type RefreshTokenPayload = {
  sub: string
  jti: string
}

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ sub: userId, role } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256',
  })
}

export const generateRefreshToken = (userId: string): { token: string; jti: string } => {
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { sub: userId, jti } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' },
  )
  return { token, jti }
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}
