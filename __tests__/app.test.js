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

describe('Index file', () => {
  it('should import all necessary items', () => {
    expect(app).toBeDefined()
    expect(request).toBeDefined()
    expect(DOCUMENT).toBeDefined()
    expect(USER_MODEL).toBeDefined()
    expect(generateJWTToken).toBeDefined()
    expect(loginUser).toBeDefined()
    expect(extractTokenMiddleware).toBeDefined()
    expect(authMiddleware).toBeDefined()
    expect(checkDocumentAccess).toBeDefined()
    expect(isAdmin).toBeDefined()
    expect(checkUserExists).toBeDefined()
    expect(validateDocumentOwnership).toBeDefined()
  })
})
// test JWT validity
describe('generateJWTToken', () => {
  it('generates a valid JWT token', async () => {
    // Define some data to use in the payload
    const data = {
      _id: '123',
      email: 'test@example.com',
      isAdmin: false
    }
    // Generate a token
    const token = await generateJWTToken(data, '1.0')

    // Verify that the token is valid
    const decoded = jwt.verify(token, ACCESS_TOKEN)
    expect(decoded.data).toEqual(data)
    expect(decoded.email).toEqual(data.email)
    expect(decoded.userId).toEqual(data._id)
    expect(decoded.isAdmin).toEqual(data.isAdmin)
    expect(decoded.version).toEqual('1.0')
  })
})
// login user
describe('loginUser function', () => {
  let user
  let token
  beforeAll(async () => {
    // create a test user
    user = await USER_MODEL.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password'
    })
    // generate JWT token for the user
    token = await generateJWTToken(
      {
        email: user.email,
        _id: user._id,
        isAdmin: user.isAdmin,
        version: user.version
      },
      user.version
    )
  })
  afterAll(async () => {
    // delete the test user
    await USER_MODEL.deleteOne({ _id: user._id })
  })
  it('should log in a user with correct credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'password'
    })
    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
  })
  it('should not log in a user with incorrect email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'wrongemail@example.com',
      password: 'password'
    })
    expect(response.status).toBe(401)
    expect(response.body.error).toEqual('Invalid email or password')
  })
  it('should not log in a user with incorrect password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'wrongpassword'
    })
    expect(response.status).toBe(401)
    expect(response.body.error).toEqual('Invalid email or password')
  })
  it('should return a server error if there is a problem with the database', async () => {
    // mock the findOne method of the user model to throw an error
    USER_MODEL.findOne = jest.fn().mockImplementationOnce(() => {
      throw new Error('Database error')
    })
    const response = await request(app).post('/api/auth/login').send({
      email: 'testuser@example.com',
      password: 'password'
    })
    expect(response.status).toBe(500)
    expect(response.body.error).toEqual('Server error')
  })
})
// test extract token
describe('extractTokenMiddleware', () => {
  const mockRequest = (headers = {}) => ({
    headers
  })
  const mockResponse = () => ({
    headers: {}
  })
  const mockNext = jest.fn()
  it('should extract token from Authorization header', () => {
    const token = 'test-token'
    const req = mockRequest({ authorization: `Bearer ${token}` })
    const res = mockResponse()

    extractTokenMiddleware(req, res, mockNext)

    expect(req.token).toBe(token)
    expect(mockNext).toHaveBeenCalled()
  })
  it('should not extract token if Authorization header is not present', () => {
    const req = mockRequest()
    const res = mockResponse()

    extractTokenMiddleware(req, res, mockNext)

    expect(req.token).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
  })
})
// test AuthMiddleware
describe('authMiddleware', () => {
  const req = {
    headers: {}
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }
  const next = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return 401 if Authorization header is missing', async () => {
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing Authorization header'
    })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 if Authorization header is invalid', async () => {
    req.headers['authorization'] = 'invalid'
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid Authorization header'
    })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 if user with email in token not found in database', async () => {
    const token = jwt.sign(
      { data: { email: 'notfound@example.com', version: 1 } },
      'secret'
    )
    req.headers['authorization'] = `Bearer ${token}`
    USER_MODEL.findOne = jest.fn().mockReturnValueOnce(undefined)
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Could not locate user!' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 if user has been deleted', async () => {
    const user = {
      email: 'test@example.com',
      _id: '1234567890',
      isAdmin: true,
      version: 1
    }
    const token = jwt.sign(
      {
        data: {
          email: user.email,
          _id: user._id,
          isAdmin: user.isAdmin,
          version: 2
        }
      },
      'secret'
    )
    req.headers['authorization'] = `Bearer ${token}`
    USER_MODEL.findOne = jest.fn().mockReturnValueOnce(user)
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'User has been deleted!' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should attach user object to req.locals and call next', async () => {
    const user = {
      email: 'test@example.com',
      _id: '1234567890',
      isAdmin: true,
      version: 1
    }
    const token = jwt.sign(
      {
        data: {
          email: user.email,
          _id: user._id,
          isAdmin: user.isAdmin,
          version: user.version
        }
      },
      'secret'
    )
    req.headers['authorization'] = `Bearer ${token}`
    USER_MODEL.findOne = jest.fn().mockReturnValueOnce(user)
    await authMiddleware(req, res, next)
    expect(USER_MODEL.findOne).toHaveBeenCalledWith({ email: user.email })
    expect(req.user).toEqual({
      data: {
        email: user.email,
        _id: user._id,
        isAdmin: user.isAdmin,
        version: user.version
      }
    })
    expect(req.token).toEqual(token)
    expect(req.locals.user).toEqual(user)
    expect(next).toHaveBeenCalled()
  })

  test('should return 401 if token is invalid', async () => {
    const token = jwt.sign(
      { data: { email: 'test@example.com', version: 1 } },
      'wrongsecret'
    )
    req.headers['authorization'] = `Bearer ${token}`
    const res = mockResponse()
    const next = jest.fn()
    await authMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid token',
      message: 'invalid signature'
    })
    expect(next).not.toHaveBeenCalled()
  })
})

// check document access test
describe('checkDocumentAccess', () => {
  let req, res, next
  beforeEach(() => {
    req = {
      params: {
        id: '12345'
      },
      locals: {
        user: {
          _id: 'user123',
          isAdmin: false
        }
      }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return 404 if document is not found', async () => {
    DOCUMENT.findById.mockResolvedValueOnce(null)
    await checkDocumentAccess(req, res, next)
    expect(DOCUMENT.findById).toHaveBeenCalledWith('12345')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Document not found' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should allow access if user is admin', async () => {
    const document = {
      _id: '12345',
      user: 'otherUser123'
    }
    DOCUMENT.findById.mockResolvedValueOnce(document)
    req.locals.user.isAdmin = true
    await checkDocumentAccess(req, res, next)
    expect(DOCUMENT.findById).toHaveBeenCalledWith('12345')
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(req.document).toEqual(document)
    expect(next).toHaveBeenCalled()
  })

  test('should allow access if user is document owner', async () => {
    const document = {
      _id: '12345',
      user: 'user123'
    }
    DOCUMENT.findById.mockResolvedValueOnce(document)
    await checkDocumentAccess(req, res, next)
    expect(DOCUMENT.findById).toHaveBeenCalledWith('12345')
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(req.document).toEqual(document)
    expect(next).toHaveBeenCalled()
  })

  test('should return 403 if user is not admin or document owner', async () => {
    const document = {
      _id: '12345',
      user: 'otherUser123'
    }
    DOCUMENT.findById.mockResolvedValueOnce(document)
    await checkDocumentAccess(req, res, next)
    expect(DOCUMENT.findById).toHaveBeenCalledWith('12345')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 500 on server error', async () => {
    const error = new Error('Database error')
    DOCUMENT.findById.mockRejectedValueOnce(error)
    await checkDocumentAccess(req, res, next)
    expect(DOCUMENT.findById).toHaveBeenCalledWith('12345')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server error',
      message: 'Try again later'
    })
    expect(next).not.toHaveBeenCalled()
  })
})

//test isAdmin
describe('isAdmin', () => {
  let req, res, next
  beforeEach(() => {
    req = {
      user: {
        isAdmin: true // Set user object with isAdmin property to true for admin access
      }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })
  it('should call next if user is admin', async () => {
    await isAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('should return 403 if user is not admin', async () => {
    req.user.isAdmin = false // Set user object with isAdmin property to false for non-admin access
    await isAdmin(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access denied: admin privileges required'
    })
  })
})
// user exists test
describe('checkUserExists', () => {
  let req, res, next, USER_MODEL
  beforeEach(() => {
    req = { params: {} }
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    next = jest.fn()
    USER_MODEL = {
      findById: jest.fn()
    }
  })
  test('should call next if user exists', async () => {
    const user = { _id: 'testUserId', name: 'John Doe' }
    USER_MODEL.findById.mockResolvedValueOnce(user)
    req.params.userId = 'testUserId'
    await checkUserExists(req, res, next)
    expect(USER_MODEL.findById).toHaveBeenCalledWith('testUserId')
    expect(req.locals.user).toEqual(user)
    expect(next).toHaveBeenCalled()
  })
  test('should return 404 if user does not exist', async () => {
    USER_MODEL.findById.mockResolvedValueOnce(null)
    req.params.userId = 'nonExistingUserId'
    await checkUserExists(req, res, next)
    expect(USER_MODEL.findById).toHaveBeenCalledWith('nonExistingUserId')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
    expect(next).not.toHaveBeenCalled()
  })
  test('should return 500 if server error occurs', async () => {
    const errorMessage = 'Error occurred while finding user'
    USER_MODEL.findById.mockRejectedValueOnce(new Error(errorMessage))
    req.params.userId = 'testUserId'
    await checkUserExists(req, res, next)
    expect(USER_MODEL.findById).toHaveBeenCalledWith('testUserId')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server error',
      message: 'Try again later'
    })
    expect(console.error).toHaveBeenCalledWith(errorMessage)
    expect(next).not.toHaveBeenCalled()
  })
})
