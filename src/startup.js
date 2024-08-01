import { config } from 'dotenv'
config()
const { MONGO_URI, NODE_ENV } = process.env

import connectDB from '../src/DB/connect.js'
import {
  openBrowser,
  resetBrowserOpenedFlag,
  cleanUpAndExit,
  clearDevPort
} from '../middleware/util.js'

const PORT = process.env.PORT || 5001

async function starterLogger (port) {
  try {
    const memoryUsage = process.memoryUsage()
    const currentMemory =
      Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100
    const currentTime = new Date().toLocaleString()
    const environment = NODE_ENV || 'development'
    const currentUser = process.env.USER || 'guest_user'
    const duration = process.env.DURATION || 'undefined'
    const logname = process.env.LOGNAME || 'undefined'

    await connectDB(MONGO_URI, true)

    console.log(`> Memory usage: ${currentMemory} MB`)
    console.log(`> Current time: ${currentTime}`)
    console.log(`> Environment: ${environment}`)
    console.log(`> User: ${currentUser}`)
    console.log(`> Duration: ${duration}`)
    console.log(`> Log name: ${logname}`)
    console.log(`> Server running on port: ${port}`)
  } catch (e) {
    console.error(`Error occurred in starterLogger function: ${e}`)
  }
}

const startServer = async (app, port, attempt = 1) => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, async () => {
        await starterLogger(port)
        if (NODE_ENV === 'development') {
          await openBrowser(port)
        }
        resolve()
      })
      server.on('error', reject)
    })
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Attempting to resolve...`)
      await clearDevPort(port)

      if (attempt < 3) {
        console.log(`Retrying to start server on port ${port}...`)
        await startServer(app, port, attempt + 1)
      } else {
        console.error(`Failed to start server after ${attempt} attempts.`)
        process.exit(1)
      }
    } else {
      console.error('Server error:', err)
      process.exit(1)
    }
  }
}

export default async app => {
  // Middleware to handle URL rewriting
  app.use('/raybags/v1/uploader/*', (req, res, next) => {
    let newUrl = req.url.replace(
      '/raybags/v1/uploader/',
      `http://${PORT}/raybags/v1/uploader/`
    )
    req.url = newUrl
    next()
  })

  // Start server with retry logic
  await startServer(app, PORT)

  // Handle cleanup on process termination
  process.on('SIGINT', cleanUpAndExit)
  process.on('SIGTERM', cleanUpAndExit)
  process.on('exit', resetBrowserOpenedFlag)
}
