import connectDB from '../src/DB/connect.js'

import { config } from 'dotenv'
config()
const { MONGO_URI } = process.env

export default async app => {
  const PORT = process.env.PORT || 5001

  app.use('/raybags/v1/uploader/*', (req, res, next) => {
    let newUrl = req.url.replace(
      '/raybags/v1/uploader/',
      `http://${PORT}/raybags/v1/uploader/`
    )
    req.url = newUrl
    next()
  })

  app.listen(PORT, async () => {
    try {
      console.log(`server running on port: ${PORT}`)
      await connectDB(MONGO_URI, true)
    } catch (e) {
      console.log(e.message)
    }
  })
}
