import { USER_MODEL, USER_ID_MODEL } from '../models/user.js'
import { sendEmail } from '../../middleware/emailer.js'
import { DOCUMENT } from '../models/documentModel.js'
import { config } from 'dotenv'
config()

const {
  RECIPIENT_EMAIL,
  AWS_BUCKET_NAME,
  AWS_REGION,
  SECRET_ADMIN_TOKEN,
  SUPER_USER_TOKEN
} = process.env

export async function CreateUserController (req, res) {
  try {
    const { name, email, password, isAdmin, secret, superUserToken } = req.body
    const isAdminUser = secret === `${SECRET_ADMIN_TOKEN}`
    const userIsAdmin = isAdmin && isAdminUser

    const isSuperUser = superUserToken === `${SUPER_USER_TOKEN}`

    if (isAdmin && !isAdminUser) {
      return res
        .status(400)
        .send({ error: 'Unauthorized - This action is forbidden!' })
    }

    const existingUser = await USER_MODEL.findOne({ email })
    if (existingUser) {
      return res.status(409).send({ error: 'User already exists' })
    }

    const newUserId = await USER_ID_MODEL.create({})
    const userId = newUserId._id

    let user

    if (isSuperUser) {
      user = new USER_MODEL({
        name,
        email,
        password,
        userId,
        isAdmin: userIsAdmin,
        superUserToken,
        isSuperUser: true
      })
      await user.save()
    } else {
      user = new USER_MODEL({
        name,
        email,
        password,
        userId,
        isAdmin: userIsAdmin
      })
      await user.save()
    }

    const token = user.generateAuthToken()

    const createUserEmailData = {
      title: 'User successfully created in your s3 bucket',
      body: `A user:\n${user}\n has successfully been created in your S3 bucket: "${AWS_BUCKET_NAME}" in: ${AWS_REGION}.`
    }
    await sendEmail(createUserEmailData, RECIPIENT_EMAIL)

    res
      .status(201)
      .send({ user: { name, email, isAdmin: user.isAdmin }, token })
  } catch (error) {
    console.error('Error processing request:', error.message)
    res.status(400).send({ error: error.message })
  }
}
export async function LoginController (req, res) {
  try {
    const user = await USER_MODEL.findOne({ email: req.body.email })
    const token = user.generateAuthToken()

    const userObject = user.toObject()
    delete userObject.password
    res.status(200).json({ user: userObject, token })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Server error' })
  }
}
export async function GetAllUsersController (req, res) {
  try {
    const isSuperUser = await USER_MODEL.isSuperUser(
      req.locals.user.superUserToken
    )

    if (!isSuperUser) {
      return res.status(401).json({ error: 'Unauthorized - Not a super user' })
    }

    const users = await USER_MODEL.find(
      {},
      { token: 0, password: 0, __v: 0 }
    ).sort({ createdAt: -1 })

    const updatedUsers = await Promise.all(
      users.map(async user => {
        const count = await DOCUMENT.countDocuments({ user: user._id })
        return { ...user.toObject(), totalDocumentsOwned: count }
      })
    )

    if (updatedUsers.length === 0) {
      return res.status(404).json('No profiles found!')
    }

    res.status(200).json({
      profile_count: `${updatedUsers.length} profiles`,
      user_profiles: updatedUsers
    })
  } catch (error) {
    console.error('Error getting all users:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
export async function GetUserController (req, res) {
  try {
    const email = req.locals.user.email
    const isSuperUser = await USER_MODEL.isSuperUser(
      req.locals.user.superUserToken
    )
    let user = {}
    let updatedUser = {}
    let count
    if (isSuperUser) {
      user = await USER_MODEL.findOne({ email })
      if (!user) return res.status(404).json('User not found!')

      count = await DOCUMENT.countDocuments({ user: user._id })
      updatedUser = {
        ...user.toObject(),
        DocumentCount: count
      }

      res.status(200).json(updatedUser)
      return
    }
    user = await USER_MODEL.findOne(
      { email },
      {
        token: 0,
        password: 0,
        isAdmin: 0,
        version: 0,
        __v: 0,
        superUserToken: 0,
        isSuperUser: 0
      }
    )
    if (!user) return res.status(404).json('User not found!')

    count = await DOCUMENT.countDocuments({ user: user._id })
    updatedUser = {
      ...user.toObject(),
      DocumentCount: count
    }
    res.status(200).json(updatedUser)
  } catch (e) {
    console.log(e)
  }
}
