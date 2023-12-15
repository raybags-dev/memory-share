// routes/userRoutes.js
import express from 'express'
import {
  LoginController,
  CreateUserController,
  GetAllUsersController,
  GetUserController,
  AllUserDocsController,
  UpdateSubscriptionController,
  GetSubscriptionController
} from '../controllers/userController.js'
import { loginUser } from '../../middleware/auth.js'

import { authMiddleware, isAdmin } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'

const router = express.Router()

//create user
router.post('/raybags/v1/uploader/create-user', CreateUserController)
//login user
router.post('/raybags/v1/user/login', loginUser, LoginController)
//get users
router.post(
  '/raybags/v1/uploader/get-users',
  authMiddleware,
  isAdmin,
  asyncMiddleware(GetAllUsersController)
)
//get user
router.post(
  '/raybags/v1/uploader/get-user',
  authMiddleware,
  asyncMiddleware(GetUserController)
)
//get all user docs
router.post(
  '/raybags/v1/uploader/user-docs',
  authMiddleware,
  asyncMiddleware(AllUserDocsController)
)
//=======================
// update sub
router.put(
  '/raybags/v1/uploader/user/:userId/subscription',
  authMiddleware,
  isAdmin,
  asyncMiddleware(UpdateSubscriptionController)
)
// get sub status
router.get(
  '/raybags/v1/uploader/user/:userId/subscription',
  authMiddleware,
  isAdmin,
  asyncMiddleware(GetSubscriptionController)
)
export default router
