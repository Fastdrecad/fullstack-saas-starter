import { type Request, type Response, type NextFunction } from 'express'
import { forbidden } from '../lib/errors.js'

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return next(forbidden('Admin access required'))
  }

  next()
}
