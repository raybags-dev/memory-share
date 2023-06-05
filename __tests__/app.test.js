import { app } from '../index'
import request from 'supertest'
import { DOCUMENT } from '../src/models/documentModel.js'
import { USER_MODEL } from '../src/models/user.js'
import jwt from 'jsonwebtoken'
import { authMiddleware, isAdmin } from '../middleware/auth.js'
import {
  generateJWTToken,
  loginUser,
  extractTokenMiddleware,
  authMiddleware,
  checkDocumentAccess,
  isAdmin,
  checkUserExists,
  validateDocumentOwnership
} from '../middleware/auth.js'
import request from 'supertest'
