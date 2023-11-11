import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()
const { ACCESS_TOKEN, ENCRYPTION_KEY } = process.env
import { USER_MODEL } from '../src/models/user.js'
import { DOCUMENT } from '../src/models/documentModel.js'

export const generateJWTToken = async (data, version) => {
  const expiresIn = 60000 // expiration time of token
  const payload = {
    data,
    email: data.email,
    userId: data._id,
    isAdmin: data.isAdmin,
    version: version
  }

  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      ACCESS_TOKEN, //secret key
      { expiresIn },
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}
// login user
export const loginUser = async (req, res, next) => {
  const { email = '', password = '' } = req.body
  try {
    // Check if user with email exists in database
    const user = await USER_MODEL.findOne({ email })
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized. Signup to use this service.' })
    }
    // Check if password matches user's password in database
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    // If user exists and password is correct, generate JWT token
    const token = await generateJWTToken(
      {
        email: user.email,
        _id: user._id,
        isAdmin: user.isAdmin, // include isAdmin in token payload
        version: user.version // include version in token payload
      },
      user.version
    )
    // Set token in response header
    res.setHeader('authorization', `Bearer ${token}`)
    // Add the user object to the request object
    req.user = user.toObject()
    // Call next to proceed to next middleware/route handler
    next()
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Server error', message: error.message })
  }
}
//   extract token
export const extractTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader) {
    const [bearer, token] = authHeader.split(' ')
    req.token = token
  }
  next()
}
export const authMiddleware = async (req, res, next) => {
  // Check if Authorization header is present
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }
  // Extract JWT token from Authorization header
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid Authorization header' })
  }
  // Verify and decode JWT token
  try {
    const decodedToken = jwt.verify(token, ACCESS_TOKEN)
    // Attach decoded token to request object for use in subsequent middleware or routes
    req.user = decodedToken
    req.token = token // Attach token to request object for use in subsequent middleware or routes

    const userEmail = decodedToken.data.email
    if (!userEmail) {
      return res.status(401).json({ error: 'Missing email in token data' })
    }

    // Check if user with email exists in database
    const user = await USER_MODEL.findOne({ email: userEmail }).maxTimeMS(10000)

    if (!user) {
      return res.status(401).json({ error: 'Could not find user!' })
    }

    // Check if the user's identifier in the token matches the identifier in the user's record
    if (decodedToken.data.version !== user.version) {
      return res.status(401).json({ error: 'User has been deleted!' })
    }

    req.locals = { user } // attach user object to req.locals
    next()
  } catch (error) {
    return res
      .status(401)
      .json({ error: 'Invalid token', message: error.message })
  }
}
export const checkDocumentAccess = async (req, res, next) => {
  try {
    const { user } = req.locals // retrieve user object from req.locals
    const document = await DOCUMENT.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }
    if (document.user.toString() !== user._id.toString() && !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.document = document
    next()
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ error: 'Server error', message: 'Try again later' })
  }
}
//   check user is admin
export const isAdmin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message:
        'Access denied: admin privileges required! Contact Raymond  for assistance!'
    })
  }
  next()
}
//   check if user exist middleware
export const checkUserExists = async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await USER_MODEL.findById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    req.locals = { user } // attach user object to req.locals
    next()
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ error: 'Server error', message: 'Try again later' })
  }
}
export const validateDocumentOwnership = async (req, res, next) => {
  try {
    const user_id = req.user.data._id
    // Find all documents that were created by the user
    const documents = await DOCUMENT.find({ user: user_id }, { data: 0 }).exec()

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Documents not found' })
    }
    // Check if the requested document is in the list of documents created by the user
    const userdocuments = documents.find(doc => doc.user.toString() === user_id)
    if (!userdocuments) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    // Attach document object to req.locals for use in subsequent middleware or routes
    req.locals = { userdocuments }
    next()
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function verifySecretKey (req, res, next) {
  try {
    // Check if the secret key is provided in the request headers
    const clientSecretKey = req.headers['x-secret-key']

    // Compare the provided secret key with the actual secret key
    if (!clientSecretKey || clientSecretKey !== ENCRYPTION_KEY) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // If the secret key is valid, allow the user to proceed
    next()
  } catch (error) {
    console.error('Error in verifySecretKey middleware:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
