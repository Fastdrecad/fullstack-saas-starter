import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { requestLogger } from './lib/logger.js'
import { authRoutes } from './features/auth/index.js'
import { userRoutes } from './features/user/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const createApp = (): Express => {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use(requestLogger)

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/users', userRoutes)

  app.use(errorHandler)

  return app
}

export { createApp }
