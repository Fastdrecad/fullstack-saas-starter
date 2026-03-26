import { type UserService } from './user.service.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { unauthorized } from '../../lib/errors.js'

export const createUserController = (userService: UserService) => ({
  getLinkedOAuth: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()

    const accounts = await userService.getLinkedOAuthAccounts(req.user.id)
    res.json({ data: accounts })
  }),

  unlinkOAuth: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()

    const provider = req.params.provider as string
    await userService.unlinkOAuthAccount(req.user.id, provider)
    res.status(204).end()
  }),
})
