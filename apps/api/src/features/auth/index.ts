import { type Router } from 'express'
import { prisma } from '../../config/database.js'
import { createAuthService } from './auth.service.js'
import { createAuthController } from './auth.controller.js'
import { createOAuthService } from './oauth.service.js'
import { createOAuthController } from './oauth.controller.js'
import { createAuthRoutes } from './auth.routes.js'

const authService = createAuthService({ db: prisma })
const authController = createAuthController(authService)

const oauthService = createOAuthService({ db: prisma })
const oauthController = createOAuthController(oauthService)

export const authRoutes: Router = createAuthRoutes(authController, oauthController)
