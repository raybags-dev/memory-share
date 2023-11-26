// routes/userRoutes.js
import express from 'express'
import {
  LoginRouter,
  CreateUserRouter,
  GetAllUsersRouter,
  GetUserRouter
} from '../controllers/userController.js'
import { loginUser } from '../../middleware/auth.js'

import { authMiddleware, isAdmin } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'

const router = express.Router()

router.post('/raybags/v1/uploader/create-user', CreateUserRouter)
router.post('/raybags/v1/user/login', loginUser, LoginRouter)

router.post(
  '/raybags/v1/uploader/get-users',
  authMiddleware,
  isAdmin,
  asyncMiddleware(GetAllUsersRouter)
)
router.post(
  '/raybags/v1/uploader/get-user',
  authMiddleware,
  asyncMiddleware(GetUserRouter)
)
export default router
