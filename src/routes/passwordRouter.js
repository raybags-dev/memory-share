import express from 'express'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { loginUser } from '../../middleware/auth.js'
import {
  ForgotPasswordRouter,
  UpdatePasswordRouter
} from '../controllers/passwordController.js'

const router = express.Router()

router.post(
  '/raybags/v1/user/forgot-password',
  asyncMiddleware(ForgotPasswordRouter)
)
router.post('/raybags/v1/user/update/password', loginUser, UpdatePasswordRouter)
export default router
