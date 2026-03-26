export const APP_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION: 'VALIDATION',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const

type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES]

export type AppError = Error & {
  code: AppErrorCode
  statusCode: number
  details?: Array<{ field: string; message: string }>
}

export const createAppError = (
  code: AppErrorCode,
  message: string,
  statusCode: number,
  details?: Array<{ field: string; message: string }>,
): AppError => {
  const error = new Error(message) as AppError
  error.code = code
  error.statusCode = statusCode
  if (details) error.details = details
  return error
}

export const notFound = (resource: string) =>
  createAppError('NOT_FOUND', `${resource} not found`, 404)

export const unauthorized = (message = 'Unauthorized') =>
  createAppError('UNAUTHORIZED', message, 401)

export const forbidden = (message = 'Forbidden') => createAppError('FORBIDDEN', message, 403)

export const conflict = (message: string) => createAppError('CONFLICT', message, 409)

export const rateLimited = () => createAppError('RATE_LIMITED', 'Rate limit exceeded', 429)
