import nodemailer from 'nodemailer'
import { config } from 'dotenv'

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

export async function sendEmail (emailData, recipient, callback) {
  // Create the email options
  const mailOptions = {
    from: EMAIL_FOR_NOTIFICATION,
    to: recipient,
    subject: emailData.title,
    text: emailData.body
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
