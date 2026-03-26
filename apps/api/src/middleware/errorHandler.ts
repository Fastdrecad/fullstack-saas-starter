import { type Request, type Response, type NextFunction } from 'express'
import { type AppError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500
  const code = 'code' in err ? err.code : 'INTERNAL'
  const message = statusCode === 500 ? 'Internal server error' : err.message

  if (statusCode === 500) {
    logger.error(err, 'Unhandled error')
  }

  const response: Record<string, unknown> = {
    error: { code, message },
  }

  if ('details' in err && err.details) {
    ;(response.error as Record<string, unknown>).details = err.details
  }

  res.status(statusCode).json(response)
}
