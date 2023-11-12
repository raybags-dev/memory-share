import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { generatePasswordResetToken } from '../src/models/user.js'

config()

const { EMAIL_PROVIDER, EMAIL_FOR_NOTIFICATION, EMAIL__APP_PASS } = process.env

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: EMAIL_PROVIDER,
  auth: {
    user: EMAIL_FOR_NOTIFICATION,
    pass: EMAIL__APP_PASS
  }
})

export async function sendEmail (
  emailData,
  recipient,
  verificationToken,
  callback
) {
  // Check if verificationToken is provided before modifying the email body
  const emailBody = verificationToken
    ? `${emailData.body}\n\nVerification Link: ${await generateVerificationLink(
        verificationToken
      )}`
    : emailData.body

  // Create the email options
  const mailOptions = {
    from: EMAIL_FOR_NOTIFICATION,
    to: recipient,
    subject: emailData.title,
    text: emailBody
  }

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error)
      if (callback) callback(error)
    } else {
      console.log('Email sent:', info.response)
      if (callback) callback(null, info.response)
    }
  })
}

export async function generateVerificationLink (verificationToken) {
  try {
    let randomToken = await generatePasswordResetToken()
    if (verificationToken) {
      return verificationToken
    } else {
      return randomToken
    }
  } catch (error) {
    console.error('Error generating verification link:', error)
    return ''
  }
}

export async function emailerhandler (error, response) {
  try {
    if (error) {
      console.error('Email sending failed:', error)
    } else {
      console.log('@@: ' + response)
    }
  } catch (e) {
    console.log('Email notification handler failed: ' + e.message)
  }
}
