import express from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { paginatedDocsController } from '../controllers/perginatedDocsController.js'
const router = express.Router()

router.post(
  '/raybags/v1/uploader/paginated-user-documents',
  authMiddleware,
  asyncMiddleware(paginatedDocsController)
)

export default router
