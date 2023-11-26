import { expect } from 'chai'
import sinon from 'sinon'
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
import { USER_MODEL } from '../src/models/user.js'
import { DOCUMENT } from '../src/models/documentModel.js'

describe('authMiddleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {
      status: sinon.stub().returns({
        json: sinon.stub()
      })
    }
    next = sinon.stub()
  })

  it('should return a 401 error when Authorization header is missing', async () => {
    await authMiddleware(req, res, next)

    expect(res.status.calledWith(401)).to.be.true
    expect(
      res.status().json.calledWith({ error: 'Missing Authorization header' })
    ).to.be.true
    expect(next.called).to.be.false
  })
  // ==================Test auth header =============
  it('should return a 401 error when Authorization header is invalid', async () => {
    req.headers['authorization'] = 'InvalidToken'

    await authMiddleware(req, res, next)

    expect(res.status.calledWith(401)).to.be.true
    expect(
      res.status().json.calledWith({ error: 'Invalid Authorization header' })
    ).to.be.true
    expect(next.called).to.be.false
  })
})
describe('isAdmin', () => {
  let req, res, next

  beforeEach(() => {
    // Initialize mock request, response, and next functions for each test
    req = {}
    res = {
      status: sinon.stub().returnsThis(), // Stub the status method
      json: sinon.spy() // Spy on the json method
    }
    next = sinon.spy() // Spy on the next function
  })

  it('should call next if req.user has isAdmin set to true', async () => {
    // Set req.user to have isAdmin set to true
    req.user = { isAdmin: true }

    // Call the isAdmin middleware
    await isAdmin(req, res, next)

    // Expect that next() was called
    expect(next.called).to.be.true

    // Expect that res.status() was not called
    expect(res.status.called).to.be.false

    // Expect that res.json() was not called
    expect(res.json.called).to.be.false
  })

  it('should return a 403 status and error message if req.user does not have isAdmin set to true', async () => {
    // Set req.user to have isAdmin set to false
    req.user = { isAdmin: false }

    // Call the isAdmin middleware
    await isAdmin(req, res, next)

    // Expect that next() was not called
    expect(next.called).to.be.false

    // Expect that res.status() was called with a 403 status code
    expect(res.status.calledWith(403)).to.be.true

    // Expect that res.json() was called with the expected error message
    expect(
      res.json.calledWithMatch({
        message:
          'Access denied: admin privileges required! Contact Raymond  for assistance!'
      })
    ).to.be.true
  })
})
describe('checkUserExists', () => {
  let req, res, next
  beforeEach(() => {
    req = {
      params: {
        userId: 'validUserId' // Provide a valid user ID for testing
      }
    }
    res = {
      status: sinon.stub(),
      json: sinon.stub() // Stub the json method
    }
    next = sinon.stub()
  })
  it('should call next() if user exists', async () => {
    // Stub the USER_MODEL.findById function to resolve with a user
    sinon.stub(USER_MODEL, 'findById').resolves({ _id: 'validUserId' })
    await checkUserExists(req, res, next)
    // Expect next() to have been called
    expect(next.called).to.be.true
    // Restore the stubbed USER_MODEL.findById
    USER_MODEL.findById.restore()
  })
  // ================= SHould return 404 if user doesnt exist =================
  it('should return a 404 status and error message if user does not exist', async () => {
    // Stub the USER_MODEL.findById function to resolve with null (user not found)
    sinon.stub(USER_MODEL, 'findById').resolves(null)
    // Stub the res object's status and json methods
    const statusStub = sinon.stub()
    const jsonStub = sinon.stub()
    res.status.returns({ json: jsonStub }) // Chain the jsonStub to the statusStub
    await checkUserExists(req, res, next)
    // Expect that next() was not called
    expect(next.called).to.be.false
    expect(
      jsonStub.calledWithMatch({
        error: 'User not found'
      })
    ).to.be.true

    // Restore the stubbed USER_MODEL.findById
    USER_MODEL.findById.restore()
  })
})
describe('generateJWTToken', () => {
  it('should generate a valid JWT token with the expected payload', async () => {
    // Mock the jwt.sign function using Sinon
    const jwtSignStub = sinon.stub(jwt, 'sign')
    jwtSignStub.callsFake((payload, secret, options, callback) => {
      // Simulate a successful JWT signing
      callback(null, 'validToken') // You can replace 'validToken' with your desired token value
    })

    // Sample payload and version for testing
    const testData = {
      _id: 'user123',
      email: 'test@example.com',
      isAdmin: true
    }
    const testVersion = 1

    try {
      const token = await generateJWTToken(testData, testVersion)

      // Assert that jwt.sign was called with the expected payload
      expect(jwtSignStub.calledOnce).to.be.true
      expect(jwtSignStub.firstCall.args[0]).to.deep.equal({
        data: testData,
        email: testData.email,
        userId: testData._id,
        isAdmin: testData.isAdmin,
        version: testVersion
      })

      // Assert that the generated token is the expected value
      expect(token).to.equal('validToken') // Replace with the expected token value
    } finally {
      // Restore the stubbed jwt.sign function
      jwtSignStub.restore()
    }
  })
})
describe('loginUser', () => {
  let req
  let res
  let next
  let sandbox

  beforeEach(() => {
    // Create mock objects for req, res, and next
    req = {
      body: {}
    }
    res = {
      status: sinon.stub().returnsThis(), // Stub res.status() to return itself
      json: () => res,
      setHeader: sinon.stub()
    }
    next = () => {}

    // Create a Sinon sandbox for each test
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    // Restore the Sinon sandbox after each test
    sandbox.restore()
  })

  it('should return a 401 status and error message if user is not found', async () => {
    req.body.email = 'nonexistent@example.com'
    req.body.password = 'password'

    // Stub the USER_MODEL.findOne function to resolve with null (user not found)
    sandbox.stub(USER_MODEL, 'findOne').resolves(null)

    await loginUser(req, res, next)

    expect(res.status.calledWith(401)).to.be.true
  })

  it('should handle server errors gracefully', async () => {
    req.body.email = 'existing@example.com'
    req.body.password = 'correct-password'
    // Mock the USER_MODEL.findOne function to throw an error
    const findOneStub = sinon
      .stub(USER_MODEL, 'findOne')
      .throws(new Error('Test error'))
    await loginUser(req, res, next)
    expect(res.status.calledWith(500)).to.be.true
    findOneStub.restore()
  })
})
describe('extractTokenMiddleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {}
    next = sinon.spy()
  })
  it('should extract and set the token when the authorization header is present', () => {
    req.headers['authorization'] = 'Bearer YourJWTToken'
    extractTokenMiddleware(req, res, next)
    expect(req.token).to.equal('YourJWTToken')
    expect(next.called).to.be.true
  })

  it('should not set the token when the authorization header is missing', () => {
    extractTokenMiddleware(req, res, next)
    expect(req.token).to.be.undefined
    expect(next.called).to.be.true
  })
})
describe('validateDocumentOwnership', () => {
  let req, res, next
  beforeEach(() => {
    req = {
      user: {
        data: {
          _id: 'user_id'
        }
      },
      locals: {}
    }
    res = {}
    next = sinon.spy()
  })

  //* ========== should handle server errors gracefully ===========//
  it('should handle server errors gracefully', async () => {
    // Stub the DOCUMENT.find function to throw an error
    sinon.stub(DOCUMENT, 'find').throws('Test error')
    const res = {
      status: sinon.stub().returnsThis(), // Returns the res object for chaining
      json: sinon.stub()
    }
    await validateDocumentOwnership(req, res, next)
    expect(res.status.calledWith(500)).to.be.true
    expect(res.json.calledWithMatch({ error: 'Server error' })).to.be.true
    expect(next.called).to.be.false

    DOCUMENT.find.restore()
  })
})
