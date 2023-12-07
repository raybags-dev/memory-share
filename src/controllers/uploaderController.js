import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { genVerificationToken } from '../../middleware/generateToken.js'
import { dbFileUploader } from '../../middleware/bd_worker.js'
import { DOCUMENT } from '../models/documentModel.js'

export async function DocsUploaderController (req, res) {
  try {
    const multerMiddleware = multer({ storage: multer.memoryStorage() }).array(
      'images'
    )
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

      let maxLimit = 6
      let docCount = await DOCUMENT.countDocuments({
        user: req.user._id
      })

      if (!req.user.isAdmin) {
        const totalDocuments = req.files.length + docCount

        if (totalDocuments > maxLimit) {
          return res.status(428).json({
            message:
              'With a demo account, this number of document uploads is not allowed!'
          })
        }

        if (docCount >= maxLimit) {
          return res.status(429).json({
            count: docCount,
            message: 'Demo upload limit reached.'
          })
        }
      }
      const { description } = req.body

      const files = []
      for (const file of req.files) {
        const acceptedTypes = [
          'jpeg',
          'jpg',
          'png',
          'gif',
          'pdf',
          'webp',
          'avif'
        ]
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
          user: req.user._id,
          token: await genVerificationToken(),
          contentType: file.mimetype,
          encoding: file.encoding,
          size: file.size,
          description
        })
      }
      await dbFileUploader(files, req, res)
    })
  } catch (error) {
    console.log(error)
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
}
