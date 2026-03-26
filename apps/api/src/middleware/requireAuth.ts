import { type Request, type Response, type NextFunction } from 'express'
import { verifyAccessToken } from '../lib/tokens.js'
import { unauthorized } from '../lib/errors.js'

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid authorization header'))
  }

  const token = header.slice(7)

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(unauthorized('Invalid or expired token'))
  }
}
