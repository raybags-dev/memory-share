const app = express()
import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { cacheResponse, getCachedData } from '../../middleware/redis.js'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
config()

import { asyncMiddleware } from '../../middleware/asyncErros.js'
import {
  dbFileUploader,
  deleteFromS3,
  checkAndUpdateDocumentUrls
} from '../../middleware/bd_worker.js'
import { GenToken } from '../../middleware/generateToken.js'

import { USER_MODEL, USER_ID_MODEL } from '../models/user.js'
import { DOCUMENT } from '../models/documentModel.js'
import {
  loginUser,
  authMiddleware,
  extractTokenMiddleware,
  checkDocumentAccess,
  isAdmin,
  checkUserExists,
  validateDocumentOwnership
} from '../../middleware/auth.js'
//fallback page path
const fallbackPagePath = new URL(
  '../../errorPage/noConnection.html',
  import.meta.url
).pathname

// create user
export async function CreateUser (app) {
  app.post('/raybags/v1/uploader/create-user', async (req, res) => {
    try {
      const { name, email, password, isAdmin } = req.body
      // Check if user already exists in the database
      const existingUser = await USER_MODEL.findOne({ email })
      if (existingUser) {
        return res.status(409).send({ error: 'User already exists' })
      }
      // Create a new userId document and extract its _id
      const newUserId = await USER_ID_MODEL.create({})
      const userId = newUserId._id
      // Create a new user instance and save it to the database
      const user = new USER_MODEL({ name, email, password, userId, isAdmin })
      await user.save()
      // Generate a JWT for the user and send back the newly created user and JWT as a response
      const token = user.generateAuthToken()
      res
        .status(201)
        .send({ user: { name, email, isAdmin: user.isAdmin }, token })
    } catch (error) {
      res.status(400).send({ error: error.message })
    }
  })
}
//login handler
export async function Login (app) {
  app.post('/raybags/v1/user/login', loginUser, async (req, res) => {
    try {
      // Find the user based on the email in the request body
      const user = await USER_MODEL.findOne({ email: req.body.email })
      // Generate a new JWT token for the user
      const token = user.generateAuthToken()
      // Return the user object and JWT token
      const userObject = user.toObject()
      delete userObject.password
      res.status(200).json({ user: userObject, token })
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Server error' })
    }
  })
}
export async function DocsUploader (app) {
  const multerMiddleware = multer({ storage: multer.memoryStorage() }).array(
    'images'
  )
  app.post(
    '/raybags/v1/uploader/upload',
    extractTokenMiddleware,
    authMiddleware,
    asyncMiddleware(async (req, res, next) => {
      try {
        multerMiddleware(req, res, async err => {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({
              status: 'Bad Request',
              message: 'Invalid file format'
            })
          } else if (err) {
            return res.status(500).json({
              status: 'Error',
              message: 'An internal error occurred: ' + err.message
            })
          }

          if (!req.files || req.files.length === 0) {
            return res.status(400).json({
              status: 'Bad Request',
              message: 'No files uploaded'
            })
          }

          const files = []
          for (const file of req.files) {
            const acceptedTypes = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'webp']
            const fileType = file.originalname.split('.').pop().toLowerCase()

            if (!acceptedTypes.includes(fileType)) {
              return res.status(400).json({
                status: 'Bad Request',
                message:
                  'Unsupported file type. Accepted file types are: ' +
                  acceptedTypes.join(', ')
              })
            }

            const isPDF = fileType === 'pdf'

            let resizedImage
            if (!isPDF) {
              const image = sharp(file.buffer)
              image.resize({ width: 800, height: 1200, fit: 'inside' })
              resizedImage = await image.toBuffer()
            } else {
              resizedImage = file.buffer
            }

            files.push({
              originalname: file.originalname,
              filename: uuidv4() + '.' + fileType,
              data: resizedImage,
              user: req.user.data._id,
              token: await GenToken(),
              contentType: file.mimetype,
              encoding: file.encoding,
              size: file.size
            })
          }
          await dbFileUploader(files, req, res)
        })
      } catch (error) {
        if (error.name === 'ValidationError') {
          if (error.errors.question) {
            return res.status(400).json({
              status: 'Bad request!',
              message: error.errors.question.message
            })
          }
          if (error.errors.response) {
            return res.status(400).json({
              status: 'Error',
              message: error.errors.response.message
            })
          }
          if (error.errors.user) {
            return res.status(400).json({
              status: 'Error',
              message: error.errors.user.message
            })
          }
        }

        return res.status(500).json({
          status: 'Error',
          message: 'An internal error occurred:  ' + error.message
        })
      }
    })
  )
}
export function AllUserDocs (app) {
  app.post(
    '/raybags/v1/uploader/user-docs',
    authMiddleware,
    validateDocumentOwnership,
    asyncMiddleware(async (req, res) => {
      const isAdmin = req.user.isAdmin
      let query
      let count
      if (isAdmin) {
        query = DOCUMENT.find({}, { token: 0 }).sort({ createdAt: -1 })
        count = await DOCUMENT.countDocuments({})
      } else {
        query = DOCUMENT.find({ user: req.user.data._id }, { token: 0 }).sort({
          createdAt: -1
        })
        count = await DOCUMENT.countDocuments({ user: req.user.data._id })
      }
      const response = await query
      if (response.length === 0) return res.status(404).json('Nothing found!')

      const updatedDoc = await checkAndUpdateDocumentUrls(response)
      res.status(200).json({ count: count, documents: updatedDoc })
    })
  )
}
export function FindOneItem (app) {
  app.post(
    '/raybags/v1/wizard/uploader/:id',
    authMiddleware,
    checkDocumentAccess,
    asyncMiddleware(async (req, res) => {
      try {
        const itemId = req.params.id
        const userId = req.user.data._id

        const document = await DOCUMENT.findOne({ _id: new ObjectId(itemId) })
        if (document.user.toString() === userId.toString()) {
          const updatedDoc = await checkAndUpdateDocumentUrls([document])
          return res.status(200).json({ message: 'Success', ...updatedDoc })
        }

        const updatedDoc = await checkAndUpdateDocumentUrls([document])
        res.status(200).json(...updatedDoc)
      } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Server error' })
      }
    })
  )
}

export function GetPaginatedDocs (app) {
  app.post(
    '/raybags/v1/uploader/paginated-user-documents',
    authMiddleware,
    validateDocumentOwnership,
    asyncMiddleware(async (req, res) => {
      const userId = req.user.data._id
      const query = DOCUMENT.find({ user: userId }, { token: 0 }).sort({
        createdAt: -1
      })
      const countQuery = query.model.find(query.getFilter())
      const count = await countQuery.countDocuments()
      let page = parseInt(req.query.page) || 1
      let perPage = parseInt(req.query.perPage) || 10
      let totalPages = Math.ceil(count / perPage)
      const skip = (page - 1) * perPage
      const response = await query.skip(skip).limit(perPage)
      if (response.length === 0)
        return res.status(404).json({
          message: 'nothing found',
          totalCount: count,
          data: response
        })

      const updatedDocs = await checkAndUpdateDocumentUrls(response)

      res.status(200).json({
        totalPages: totalPages,
        totalCount: count,
        data: updatedDocs
      })
    })
  )
}
export function deleteUserAndOwnDocs (app) {
  app.delete(
    '/raybags/v1/delete-user-and-docs/:userId',
    authMiddleware,
    asyncMiddleware(async (req, res) => {
      const userId = req.params.userId
      // Check if the user exists
      const user = await USER_MODEL.findById(
        { _id: userId },
        { isAdmin: 0, password: 0, _id: 0, userId: 0 }
      )
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      // Delete all documents associated with the user
      await DOCUMENT.deleteMany({ user: userId })
      // Delete the user
      const { acknowledged } = await USER_MODEL.deleteOne({
        _id: userId
      })
      const { name, email, createdAt } = user
      res.status(200).json({
        status: acknowledged,
        user_profile: { username: name, user_email: email, createdAt },
        message: `User profile ${userId}, and all related documents has been deleted`
      })
    })
  )
}
export function deleteUserDocs (app) {
  app.delete(
    '/raybags/v1/delete-user-docs/:userId',
    authMiddleware,
    asyncMiddleware(async (req, res) => {
      const userId = req.params.userId
      // Check if the user exists
      const user = await USER_MODEL.findById(
        { _id: userId },
        { isAdmin: 0, password: 0, _id: 0, userId: 0 }
      )
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      // Find all documents associated with the user
      const documents = await DOCUMENT.find({ user: userId })
      if (documents.length === 0) {
        return res
          .status(200)
          .json({ message: 'User has no documents to delete' })
      }
      // Loop through each document and delete from AWS S3 and MongoDB
      for (const document of documents) {
        // Delete from AWS S3
        await deleteFromS3(document.filename)
        // Delete from MongoDB
        await document.delete()
      }
      const { name, email, createdAt } = user
      res.status(200).json({
        message: 'User documents deleted',
        user_profile: { username: name, user_email: email, createdAt }
      })
    })
  )
}
export function DeleteOneDoc (app) {
  app.delete(
    '/raybags/v1/delete-doc/:id',
    authMiddleware,
    checkDocumentAccess,
    asyncMiddleware(async (req, res) => {
      const itemId = req.params.id
      const userId = req.user.data._id
      let item = await DOCUMENT.findOne({ _id: new ObjectId(itemId) })
      if (!item) return res.status(404).json('Document could not be found')
      // If the user is an admin, they can delete any document
      if (item && req.user.isAdmin) {
        //delete from aws and mongodb
        await deleteFromS3(item.filename)
        await item.delete()

        return res.status(200).json({
          message: 'Document deleted',
          deletedDocument: {
            filename: item.filename,
            _id: item._id,
            deletedAt: new Date().toISOString()
          }
        })
      }
      // If the user created the document, they can delete it
      if (item.user.toString() === userId.toString()) {
        //delete from aws and mongodb
        await deleteFromS3(item.filename)
        await item.delete()
        return res.status(200).json({
          message: 'Document deleted',
          deletedDocument: {
            filename: item.filename,
            _id: item._id,
            deletedAt: new Date().toISOString()
          }
        })
      }
      // Otherwise, the user cannot delete the document
      return res
        .status(401)
        .json({ message: 'You are not authorized to delete this Document' })
    })
  )
}
export function GetAllUsers (app) {
  app.post(
    '/raybags/v1/uploader/get-users',
    authMiddleware,
    isAdmin,
    asyncMiddleware(async (req, res) => {
      const users = await USER_MODEL.find(
        {},
        { token: 0, password: 0, __v: 0 }
      ).sort({
        createdAt: -1
      })

      const updatedUsers = await Promise.all(
        users.map(async user => {
          const count = await DOCUMENT.countDocuments({ user: user._id })
          return { ...user.toObject(), totalDocumentsOwned: count }
        })
      )

      if (updatedUsers.length === 0)
        return res.status(404).json('No profiles found!')

      res.status(200).json({
        profile_count: `${updatedUsers.length} profiles`,
        user_profiles: updatedUsers
      })
    })
  )
}
export function GetUser (app) {
  app.post(
    '/raybags/v1/uploader/get-user',
    authMiddleware,
    asyncMiddleware(async (req, res) => {
      const email = req.query.email

      const user = await USER_MODEL.findOne(
        { email },
        { token: 0, password: 0, isAdmin: 0, version: 0, __v: 0 }
      )
      if (!user) return res.status(404).json('User not found!')

      const count = await DOCUMENT.countDocuments({ user: user._id })
      const updatedUser = {
        ...user.toObject(),
        DocumentCount: count
      }

      res.status(200).json(updatedUser)
    })
  )
}
export function NotSupported (req, res, next) {
  res.status(502).sendFile(fallbackPagePath)
}
