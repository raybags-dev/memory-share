import express from 'express'
import { authMiddleware, checkDocumentAccess } from '../../middleware/auth.js'
import { asyncMiddleware } from '../../middleware/asyncErros.js'
import {
  deleteUserAndOwnDocsRouter,
  deleteUserDocsRouter,
  DeleteOneDocRouter
} from '../controllers/deleteUserDocsController.js'
const router = express.Router()
router.delete(
  '/raybags/v1/delete-user-and-docs/:userId',
  authMiddleware,
  asyncMiddleware(deleteUserAndOwnDocsRouter)
)

router.delete(
  '/raybags/v1/delete-user-docs/:userId',
  authMiddleware,
  asyncMiddleware(deleteUserDocsRouter)
)

router.delete(
  '/raybags/v1/delete-doc/:id',
  authMiddleware,
  checkDocumentAccess,
  asyncMiddleware(DeleteOneDocRouter)
)

export default router
