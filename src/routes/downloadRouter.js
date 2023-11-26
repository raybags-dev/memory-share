import express from 'express'
import { authMiddleware, checkDocumentAccess } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { downloadRouter } from '../controllers/downloadController.js'

const router = express.Router()

router.post(
  '/raybags/v1/wizard/uploader/download/:id',
  authMiddleware,
  checkDocumentAccess,
  asyncMiddleware(downloadRouter)
)

export default router
