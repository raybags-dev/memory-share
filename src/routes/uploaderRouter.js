import express from 'express'
import {
  authMiddleware,
  extractTokenMiddleware
} from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import { DocsUploaderRouter } from '../controllers/uploaderController.js'

const router = express.Router()

router.post(
  '/raybags/v1/uploader/upload',
  extractTokenMiddleware,
  authMiddleware,
  asyncMiddleware(DocsUploaderRouter)
)

export default router
