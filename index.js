import express from 'express'
const app = express()
import cors from 'cors'
import morgan from 'morgan'
import startUp from './src/startup.js'
import routesHandler from './src/routes_handler.js'
import bodyParser from 'body-parser'

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(morgan('tiny'))
routesHandler(app)

startUp(app)
