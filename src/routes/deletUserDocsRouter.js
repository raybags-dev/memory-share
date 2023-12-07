import express from 'express'
import { authMiddleware, checkDocumentAccess } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import {
  deleteUserAndOwnDocsController,
  deleteUserDocsController,
  DeleteOneDocController
} from '../controllers/deleteUserDocsController.js'
const router = express.Router()
router.delete(
  '/raybags/v1/delete-user-and-docs/:userId',
  authMiddleware,
  asyncMiddleware(deleteUserAndOwnDocsController)
)

router.delete(
  '/raybags/v1/delete-user-docs/:userId',
  authMiddleware,
  asyncMiddleware(deleteUserDocsController)
)

router.delete(
  '/raybags/v1/delete-doc/:id',
  authMiddleware,
  checkDocumentAccess,
  asyncMiddleware(DeleteOneDocController)
)

export default router
