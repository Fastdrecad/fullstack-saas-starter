import { type Router } from 'express'
import { prisma } from '../../config/database.js'
import { createUserService } from './user.service.js'
import { createUserController } from './user.controller.js'
import { createUserRoutes } from './user.routes.js'

const userService = createUserService({ db: prisma })
const userController = createUserController(userService)
export const userRoutes: Router = createUserRoutes(userController)
