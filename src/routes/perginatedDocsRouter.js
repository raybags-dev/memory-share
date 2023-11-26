import express from 'express'
import {
  authMiddleware,
  validateDocumentOwnership
} from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { paginatedDocsRouter } from '../controllers/perginatedDocsController.js'
const router = express.Router()

router.post(
  '/raybags/v1/uploader/paginated-user-documents',
  authMiddleware,
  validateDocumentOwnership,
  asyncMiddleware(paginatedDocsRouter)
)

export default router
