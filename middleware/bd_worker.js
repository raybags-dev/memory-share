import { config } from 'dotenv'
import { Readable } from 'stream'
import {
  S3Client,
  CreateBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { sendEmail } from './emailer.js'
import { DOCUMENT } from '../src/models/documentModel.js'

config()
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  RECIPIENT_EMAIL
} = process.env

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

// Upload files to S3 and save their information to MongoDB
export const dbFileUploader = async (files, req, res) => {
  try {
    const savedFiles = await saveImagesToS3(files)
    const duplicateFiles = savedFiles.filter(file => file.error)

    if (duplicateFiles.length > 0) {
      return res.status(409).json({
        status: 'Conflict',
        message: 'One or more files already exist in storage.',
        files: duplicateFiles
      })
    }

    const validFiles = savedFiles.filter(
      file => file.message === 'File uploaded successfully'
    )
    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: validFiles
    })
  } catch (error) {
    console.log(error.message, 'in dbFileUploader')
    return res.status(500).json({
      status: 'Error',
      message:
        'An internal error occurred while uploading files: ' + error.message
    })
  }
}

// Create an S3 bucket
export const createBucket = async () => {
  try {
    const command = new CreateBucketCommand({ Bucket: AWS_BUCKET_NAME })
    await s3.send(command)

    // Notify in case of successful S3 bucket creation
    const createBucketEmailData = {
      title: 'Bucket Creation Successful',
      body: `S3 bucket "${AWS_BUCKET_NAME}" successfully created in ${AWS_REGION}.`
    }
    await sendEmail(createBucketEmailData, RECIPIENT_EMAIL)

    console.log('Bucket created successfully.\n')
    return AWS_BUCKET_NAME
  } catch (err) {
    if (err.name === 'BucketAlreadyOwnedByYou') {
      console.log(`Bucket ${AWS_BUCKET_NAME} already exists.`)
      return AWS_BUCKET_NAME
    } else if (err.statusCode === 404) {
      console.log('Bucket does not exist.')
      return false
    } else if (
      err.name === 'BucketAlreadyExists' ||
      err.httpStatusCode === 409
    ) {
      console.log(`Bucket ${AWS_BUCKET_NAME} already exists.`)
      return AWS_BUCKET_NAME
    } else {
      console.error('Error creating bucket:', err)
      throw err
    }
  }
}

// Save images to S3
export async function saveImagesToS3 (files) {
  try {
    const urls = []

    for (let file of files) {
      // Check if the file exists in MongoDB
      const existingDocument = await DOCUMENT.findOne({
        originalname: file.originalname
      })

      if (existingDocument) {
        // File already exists, return the URL and signature from the database
        urls.push({
          url: existingDocument.url,
          signature: existingDocument.signature,
          error: 'Duplication detected'
        })
      } else {
        // File does not exist, upload to S3 and save to MongoDB
        const uploadParams = {
          Bucket: AWS_BUCKET_NAME,
          Body: file.data,
          Key: file.filename,
          ContentType: file.contentType
        }

        await s3.send(new PutObjectCommand(uploadParams))

        const signedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: file.filename }),
          { expiresIn: 604800 }
        )

        const urlParts = signedUrl.split('?')
        const url = urlParts[0]
        const signature = urlParts[1]

        // Create a new document for the uploaded file
        const newDocument = new DOCUMENT({
          ...file,
          url: url,
          signature: signature,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        // Save the new document to the database
        await newDocument.save()

        urls.push({
          url: newDocument.url,
          signature: newDocument.signature,
          message: 'File uploaded successfully'
        })
      }
    }

    // Notify in case of successful upload
    const uploadEmailData = {
      title: 'Upload successful',
      body: `There has been a successful upload to your S3 bucket "${AWS_BUCKET_NAME}" in ${AWS_REGION}. A total of ${urls.length} files were uploaded successfully.`
    }
    await sendEmail(uploadEmailData, RECIPIENT_EMAIL)

    return urls
  } catch (err) {
    console.log(err)
    if (err.name === 'NoSuchBucket') {
      console.error('This bucket does not exist')
    }
    throw err
  }
}

// Delete a file from S3
export async function deleteFromS3 (filename) {
  const command = new DeleteObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: filename
  })
  try {
    const response = await s3.send(command)
    if (response.$metadata.httpStatusCode === 204) {
      // Notify in case of successful deletion
      const deleteEmailData = {
        title: 'Document deleted successfully',
        body: `The document:\n${filename}\n has successfully been deleted from your S3 bucket "${AWS_BUCKET_NAME}" in ${AWS_REGION}.`
      }
      await sendEmail(deleteEmailData, RECIPIENT_EMAIL)
      console.log(`File ${filename} deleted successfully from S3`)
    }
  } catch (err) {
    console.error(`Error deleting file ${filename} from S3: ${err.message}`)
    throw err
  }
}

// Check and update document URLs if they are expired
export async function checkAndUpdateDocumentUrls (files) {
  const updatedDocs = []
  const notExpiredDocs = []

  for (const file of files) {
    try {
      const isExpired = await checkExpiryDate(file.expiresAt)

      if (isExpired) {
        const getObjectParams = {
          Bucket: AWS_BUCKET_NAME,
          Key: file.filename,
          Expires: 604800
        }

        const newUrl = await getSignedUrl(
          s3,
          new GetObjectCommand(getObjectParams),
          { expiresIn: 604800 }
        )

        const urlParts = newUrl.split('?')
        const url = urlParts[0]
        const signature = urlParts[1]

        // Update the file's URL, signature, and expiresAt fields in the database
        const updatedDoc = await DOCUMENT.findByIdAndUpdate(
          file._id,
          {
            url: url,
            signature: signature,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          { new: true }
        )
        updatedDocs.push(updatedDoc)
      } else {
        notExpiredDocs.push(file)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return [...notExpiredDocs, ...updatedDocs]
}

// Check if a timestamp is expired
export async function checkExpiryDate (timestamp) {
  const dbTimestamp = new Date(Date.parse(timestamp))
  const currentDate = new Date()
  return dbTimestamp.getTime() < currentDate.getTime()
}

// Create a readable stream from image data
export async function createFileReadStream (imageData) {
  try {
    if (Buffer.isBuffer(imageData)) {
      // If 'imageData' is already a Buffer, use it directly
      const fileStream = new Readable()
      fileStream.push(imageData)
      fileStream.push(null)
      return fileStream
    } else {
      throw new Error('Invalid image data')
    }
  } catch (error) {
    console.log(error.message)
    throw error
  }
}
