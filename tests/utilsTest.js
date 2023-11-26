import chai from 'chai'
import { expect } from 'chai'
import sinon from 'sinon'

import { authMiddleware, isAdmin } from '../middleware/auth.js'
import { emailerhandler, sendEmail } from '../middleware/emailer.js'

describe('emailerhandler', () => {
  it('should log an error message when passed an error', () => {
    const error = 'Test error'
    const response = undefined // Simulating an error response
    const consoleErrorSpy = sinon.spy(console, 'error')
    emailerhandler(error, response)
    expect(consoleErrorSpy.calledWith('Email sending failed:', error)).to.be
      .true
    consoleErrorSpy.restore()
  })

  it('should log a success message when passed a response', () => {
    const error = null // Simulating a successful response
    const response = 'Test response'

    const consoleLogSpy = sinon.spy(console, 'log')

    emailerhandler(error, response)

    expect(consoleLogSpy.calledWith('@@: Test response')).to.be.true
    consoleLogSpy.restore()
  })

  it('should handle exceptions gracefully', () => {
    const error = 'Test error'
    const response = 'Test response'

    const consoleLogSpy = sinon.spy(console, 'log')
    sinon.stub(JSON, 'stringify').throws(new Error('JSON.stringify error'))

    emailerhandler(error, response)
    console.log('consoleLogSpy calls:', consoleLogSpy.getCalls())
    console.log(
      'consoleLogSpy calledWith:',
      consoleLogSpy.calledWith(
        'Email notification handler failed: JSON.stringify error'
      )
    )
    console.log('consoleErrorSpy calledWith:')
    consoleLogSpy.restore()
    JSON.stringify.restore()
  })
})
// test send email function
describe('sendEmail', () => {
  let consoleErrorSpy
  let consoleLogSpy
  let transporterSendMailStub

  beforeEach(() => {
    consoleErrorSpy = sinon.spy(console, 'error')
    consoleLogSpy = sinon.spy(console, 'log')

    transporterSendMailStub = sinon.stub()
  })

  afterEach(() => {
    consoleErrorSpy.restore()
    consoleLogSpy.restore()
  })

  it('should log an error message and call the callback when email sending fails', () => {
    const emailData = {
      title: 'Test Email',
      body: 'This is a test email body'
    }
    const recipient = 'test@example.com'
    const error = new Error('Test error')

    transporterSendMailStub.callsArgWith(1, error)

    sendEmail(
      emailData,
      recipient,
      (err, response) => {
        expect(consoleErrorSpy.calledWith('Error sending email:', error)).to.be
          .true

        expect(err).to.equal(error)
        expect(response).to.be.undefined
      },
      { sendMail: transporterSendMailStub }
    )
  })

  it('should log a success message and call the callback when email sending is successful', () => {
    const emailData = {
      title: 'Test Email',
      body: 'This is a test email body'
    }
    const recipient = 'test@example.com'
    const successResponse = 'Test response'

    transporterSendMailStub.callsArgWith(1, null, { response: successResponse })

    // Call the sendEmail function
    sendEmail(
      emailData,
      recipient,
      (err, response) => {
        expect(consoleLogSpy.calledWith('Email sent:', successResponse)).to.be
          .true

        expect(err).to.be.null
        expect(response).to.equal(successResponse)
      },
      { sendMail: transporterSendMailStub }
    )
  })
})
