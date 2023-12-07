// routes/userRoutes.js
import express from 'express'
import {
  LoginController,
  CreateUserController,
  GetAllUsersController,
  GetUserController
} from '../controllers/userController.js'
import { loginUser } from '../../middleware/auth.js'

import { authMiddleware, isAdmin } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'

const router = express.Router()

router.post('/raybags/v1/uploader/create-user', CreateUserController)
router.post('/raybags/v1/user/login', loginUser, LoginController)

router.post(
  '/raybags/v1/uploader/get-users',
  authMiddleware,
  isAdmin,
  asyncMiddleware(GetAllUsersController)
)
router.post(
  '/raybags/v1/uploader/get-user',
  authMiddleware,
  asyncMiddleware(GetUserController)
)
export default router
