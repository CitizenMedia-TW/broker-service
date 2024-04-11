import express from 'express'
/* import mongoose from 'mongoose' */
import cors from 'cors'
require('module-alias/register') // Required for module aliasing
const app = express()

/* Not sure if this is needed but too scared to remove it */
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

/* Connect to the MongoDB database */
require('./database')
require('./constants')

import { getUser } from './database/get'
import { patchLinks } from './database/patch'
import { createUser } from './database/post'
import { deleteUser } from './database/delete'

app.get('/', async (_req, res) => {
  const name = 'dev'
  const mail = 'dev@dev.com'
  const avatar = 'https://avatar.com'
  // const i = await createUser({ name, mail, avatar })
  // const i = await deleteUser(mail)
  // const u = await getUser('user1@example.com')
  // const p = await patchLinks('user1@example.com', 'https://profile.com/0')
  console.log()
  res.send()
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
