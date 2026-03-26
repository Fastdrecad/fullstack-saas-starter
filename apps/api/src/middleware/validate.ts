import { type Request, type Response, type NextFunction } from 'express'
import { type ZodSchema, ZodError } from 'zod'
import { createAppError } from '../lib/errors.js'

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
        next(createAppError('VALIDATION', 'Validation failed', 400, details))
      } else {
        next(err)
      }
    }
  }
}
