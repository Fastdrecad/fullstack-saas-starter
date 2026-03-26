import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth.js'
import { type createUserController } from './user.controller.js'

type UserController = ReturnType<typeof createUserController>

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router()

  router.get('/me/oauth', requireAuth, userController.getLinkedOAuth)
  router.delete('/me/oauth/:provider', requireAuth, userController.unlinkOAuth)

  return router
}
