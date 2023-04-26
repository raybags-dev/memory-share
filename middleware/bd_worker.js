import AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid'
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand
} from '@aws-sdk/client-s3'
import { config } from 'dotenv'
config()
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION
} = process.env
import { DOCUMENT } from '../src/models/documentModel.js'
import { GenToken } from '../middleware//generateToken.js'

// S3 client
const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

// save to mongodb
export const dbFileUploader = async (files, req, res) => {
  try {
    const savedFiles = []
    const duplicateFiles = []
    const urls = await saveImagesToS3(files)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const existingFile = await DOCUMENT.findOne({
        originalname: file.originalname
      })

      if (existingFile) {
        duplicateFiles.push(file.originalname)
      } else {
        const savedFile = await DOCUMENT.create({
          ...file,
          url: urls[i].url,
          signature: urls[i].signature
        })
        savedFiles.push(savedFile)
      }
    }

    if (duplicateFiles.length > 0) {
      return res.status(400).json({
        message: `The following file(s) already exist`,
        duplicates: duplicateFiles
      })
    } else {
      return res.status(200).json({
        message: 'Files uploaded successfully',
        files: savedFiles
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 'Error',
      message:
        'An internal error occurred while uploading files: ' + error.message
    })
  }
}

//*******aws s3 bucket ******
export const createBucket = async () => {
  try {
    const command = new CreateBucketCommand({ Bucket: `${AWS_BUCKET_NAME}` })
    await s3.send(command)

    console.log('Bucket created successfully.\n')
    return AWS_BUCKET_NAME
  } catch (err) {
    if (err.Code === 'BucketAlreadyOwnedByYou') {
      console.log(`Bucket ${err.BucketName} already exists.`)
      return err.BucketName
    }
    if (err.statusCode === 404) {
      console.log(`Bucket does not exist.`)
      return false
    }
    if (err.Code === 'BucketAlreadyOwnedByYou') {
      console.log(`Bucket ${err.BucketName} already exists.`)
      return err.BucketName
    }
    if (err.httpStatusCode === 409) {
      console.log(`Bucket ${err.BucketName} already exists.`)
      return err.BucketName
    }
    console.log(err.message) // re-throw any other errors
  }
}
//saves to aws-bucket

export async function saveImagesToS3 (files) {
  try {
    const urls = []
    const s3 = new AWS.S3()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.data,
        Key: file.filename,
        ContentType: file.contentType
      }
      const signedUrlParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: file.filename,
        Expires: 604800
      }

      // **********************
      // ******* TO DO generate presign urls *********
      //* aws s3 presign s3://ray-doc-files/09c8e2a9-b7a3-459f-8f75-95e9a7ce4260.jpeg --expires-in 604800
      // **********************

      const result = await s3.upload(uploadParams).promise()
      const signedUrls = await s3.getSignedUrl('getObject', signedUrlParams)

      const urlParts = result.Location.split('amazonaws.com/')
      const url = urlParts[0] + 'amazonaws.com'
      const signature = urlParts[1] + '?' + signedUrls.split('?')[1]

      urls.push({ url, signature })
    }

    return urls
  } catch (e) {
    throw new Error(e.message)
  }
}
