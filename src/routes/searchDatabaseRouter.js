import express from 'express'
import {
  authMiddleware,
  validateDocumentOwnership
} from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { SearchUserDocsRouter } from '../controllers/searchDatabaseController.js'

const router = express.Router()

router.post(
  '/raybags/v1/uploader/search-docs',
  authMiddleware,
  validateDocumentOwnership,
  asyncMiddleware(SearchUserDocsRouter)
)
export default router
