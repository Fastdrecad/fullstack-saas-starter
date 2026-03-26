import pino from 'pino'
import { pinoHttp, type Options } from 'pino-http'
import { env } from '../config/env.js'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'token',
      'refreshToken',
      'accessToken',
    ],
    censor: '[REDACTED]',
  },
})

const httpLoggerOptions: Options = {
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
}

export const requestLogger = pinoHttp(httpLoggerOptions)
