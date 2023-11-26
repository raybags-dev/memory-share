import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const userIdSchema = new mongoose.Schema({}, { timestamps: true })

const userModel = {
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 5,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 1024
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserId',
    required: true
  },
  password_reset_token: {
    type: String
  }
}

const userSchema = new mongoose.Schema(userModel, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Virtual field for password reset token
userSchema.virtual('passwordResetToken').get(function () {
  return generatePasswordResetToken()
})

// Method to set the password reset token
userSchema.methods.setPasswordResetToken = async function () {
  this.password_reset_token = await generatePasswordResetToken()
  await this.save()
  return this.password_reset_token
}

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    process.env.MY_SECRET
  )
  return token
}

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email })
  if (!user) {
    throw new Error('Invalid login credentials')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new Error('Invalid login credentials')
  }
  return user
}

userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 8)
  }
  // Only increment the version if the password is modified
  if (this.isModified('password') || this.isNew) {
    this.version = this.version + 1
  }
  next()
})

const USER_MODEL = mongoose.model('User', userSchema)
const USER_ID_MODEL = mongoose.model('UserId', userIdSchema)

export async function generatePasswordResetToken () {
  const token = randomBytes(64).toString('hex')
  return token
}

export { USER_MODEL, USER_ID_MODEL }
