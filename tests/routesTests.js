import chai from 'chai'
import chaiHttp from 'chai-http'
import sinon from 'sinon'
import express from 'express'
import jwt from 'jsonwebtoken'
import {
  authMiddleware,
  isAdmin,
  checkUserExists,
  generateJWTToken,
  loginUser,
  extractTokenMiddleware,
  validateDocumentOwnership
} from '../middleware/auth.js'
import { sendEmail } from '../middleware/emailer.js'
import { USER_MODEL, USER_ID_MODEL } from '../src/models/user.js'
import { DOCUMENT } from '../src/models/documentModel.js'
import { CreateUser, Login } from '../src/routes/router.js'

chai.use(chaiHttp)
const expect = chai.expect

describe('CreateUser', () => {
  let app

  before(() => {
    // Create a stub for USER_MODEL.findOne
    sinon.stub(USER_MODEL, 'findOne')
    // Create a stub for USER_ID_MODEL.create
    sinon.stub(USER_ID_MODEL, 'create')
  })

  after(() => {
    // Restore the stubs after the test
    USER_MODEL.findOne.restore()
    USER_ID_MODEL.create.restore()
  })

  beforeEach(() => {
    app = express()
    // Define the route for CreateUser
    CreateUser(app)
  })
})
//* =========== Login ============//
describe('Login', async function () {
  this.timeout(5000)
  let app

  beforeEach(() => {
    // Create an Express app instance
    app = express()
    // Define the route for Login
    Login(app)
  })

  it('should return a 200 status with user and token on successful login', async function () {})
})
