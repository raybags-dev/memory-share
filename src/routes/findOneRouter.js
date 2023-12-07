import express from 'express'
import { authMiddleware, checkDocumentAccess } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { FindOneDocController } from '../controllers/findOneController.js'

const router = express.Router()

router.post(
  '/raybags/v1/wizard/uploader/:id',
  authMiddleware,
  checkDocumentAccess,
  asyncMiddleware(FindOneDocController)
)

export default router
