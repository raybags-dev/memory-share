import express from 'express'
import {
  authMiddleware,
  validateDocumentOwnership
} from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { AllUserDocsRouter } from '../controllers/allUsersController.js'

const router = express.Router()

router.post(
  '/raybags/v1/uploader/user-docs',
  authMiddleware,
  validateDocumentOwnership,
  asyncMiddleware(AllUserDocsRouter)
)

export default router
