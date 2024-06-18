import express from 'express'
/* import mongoose from 'mongoose' */
import cors from 'cors'
require('module-alias/register') // Required for module aliasing
const app = express()
const cookieParser = require('cookie-parser')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({ origin: true, credentials: true }))
app.use(cookieParser())

/* Connect to the MongoDB database */
require('./database')
require('./constants')

/* Cookie test */
app.post('/', async (req, res) => {
  res.cookie('access_token', 456, {
    httpOnly: true,
    maxAge: 1000 * 60, // 1 minute
    secure: true,
    sameSite: 'lax',
  })
  res.status(200).send({ mes: 'Cookie set' })
})
app.get('/', async (req, res) => {
  console.log('from post: ', req.cookies)
  res.status(200).send({ mes: req.cookies })
})

import { authRoute } from './routes'
app.use('/auth', authRoute)

import { storyRoute } from './routes'
app.use('/story', storyRoute)

import { userRoute } from './routes'
app.use('/user', userRoute)

app.listen(8080, () => {
  console.log('Listening on port 8080')
})
