import chai from 'chai'
import { expect } from 'chai'
import sinon from 'sinon'

import { authMiddleware, isAdmin } from '../middleware/auth.js'
import { emailerhandler, sendEmail } from '../middleware/emailer.js'

// ytest email handler function
describe('emailerhandler', () => {
  it('should log an error message when passed an error', () => {
    const error = 'Test error'
    const response = undefined // Simulating an error response
    // Create a Sinon spy for console.error
    const consoleErrorSpy = sinon.spy(console, 'error')
    emailerhandler(error, response)
    // Assert that console.error was called with the expected message
    expect(consoleErrorSpy.calledWith('Email sending failed:', error)).to.be
      .true
    // Restore the original console.error function
    consoleErrorSpy.restore()
  })

  it('should log a success message when passed a response', () => {
    const error = null // Simulating a successful response
    const response = 'Test response'

    // Create a Sinon spy for console.log
    const consoleLogSpy = sinon.spy(console, 'log')

    emailerhandler(error, response)

    // Assert that console.log was called with the expected message
    expect(consoleLogSpy.calledWith('@@: Test response')).to.be.true

    // Restore the original console.log function
    consoleLogSpy.restore()
  })

  it('should handle exceptions gracefully', () => {
    const error = 'Test error'
    const response = 'Test response'

    // Create Sinon spies for console.log and console.error
    const consoleLogSpy = sinon.spy(console, 'log')
    sinon.stub(JSON, 'stringify').throws(new Error('JSON.stringify error'))

    emailerhandler(error, response)
    // Debugging statements
    console.log('consoleLogSpy calls:', consoleLogSpy.getCalls())
    console.log(
      'consoleLogSpy calledWith:',
      consoleLogSpy.calledWith(
        'Email notification handler failed: JSON.stringify error'
      )
    )
    console.log('consoleErrorSpy calledWith:')
    // Restore the original functions and JSON.stringify
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
    // Create spies for console.error and console.log
    consoleErrorSpy = sinon.spy(console, 'error')
    consoleLogSpy = sinon.spy(console, 'log')

    // Create a Sinon stub for transporter.sendMail
    transporterSendMailStub = sinon.stub()
  })

  afterEach(() => {
    // Restore the original functions
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

    // Configure the transporterSendMailStub to call its callback with an error
    transporterSendMailStub.callsArgWith(1, error)

    // Call the sendEmail function
    sendEmail(
      emailData,
      recipient,
      (err, response) => {
        // Check if console.error was called with the expected message
        expect(consoleErrorSpy.calledWith('Error sending email:', error)).to.be
          .true

        // Check if the callback was called with an error
        expect(err).to.equal(error)
        expect(response).to.be.undefined
      },
      { sendMail: transporterSendMailStub }
    ) // Pass the stub as a part of a transporter object
  })

  it('should log a success message and call the callback when email sending is successful', () => {
    const emailData = {
      title: 'Test Email',
      body: 'This is a test email body'
    }
    const recipient = 'test@example.com'
    const successResponse = 'Test response'

    // Configure the transporterSendMailStub to call its callback with a success response
    transporterSendMailStub.callsArgWith(1, null, { response: successResponse })

    // Call the sendEmail function
    sendEmail(
      emailData,
      recipient,
      (err, response) => {
        // Check if console.log was called with the expected message
        expect(consoleLogSpy.calledWith('Email sent:', successResponse)).to.be
          .true

        // Check if the callback was called with the success response
        expect(err).to.be.null
        expect(response).to.equal(successResponse)
      },
      { sendMail: transporterSendMailStub }
    ) // Pass the stub as a part of a transporter object
  })
})
