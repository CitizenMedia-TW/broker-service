import express from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import crypto from 'crypto'
import { User, Token } from '@/src/models'
import { sendMail, resetPassword, retrieveJwtToken, comparePassword, encryptPassword } from './auth.utils'
import { JWT_SECRET } from '@/src/constants'
import { getUser, type User as SqlUser } from '../database/get'
import { type NewUser, createUser } from '../database/post'

// Return type of login
interface IUser {
  name: string
  email: string
  avatar: string
  jwtToken: string
  id: string
}

const router = express.Router()

/* foundUser = {
 * username: string,
 * email: string,
 * password: string,
 * }
 */

router.post('/google', async (req, res) => {
  const id_token = req.body.id_token
  const { data } = await axios.get(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${id_token}`
  )

  if (data['email_verified'] != 'true') {
    return res.status(401).send({ error: 'Email not verified' })
  }

  const foundUser = await getUser(data["email"]);

  if (foundUser) {
    const jwt_token = await retrieveJwtToken({
      name: data["name"],
      mail: data["email"],
      id: "0",
    });
    const user: IUser = {
      name: data['name'],
      email: data['email'],
      avatar: data['picture'],
      jwtToken: jwt_token,
      id: "0",
    }
    return res.status(200).send(user)
  }

  /* Create new user if not found */
  const newUser: NewUser = {
    name: data["name"],
    mail: data["email"],
    avatar: data["picture"],
  };
  const saveResult = await createUser(newUser);
  if (saveResult.error) {
    return res.status(500).send({ error: 'Error creating user' })
  }

  const jwt_token = await retrieveJwtToken({
    name: data["name"],
    mail: data["email"],
    id: "0",
  });
  const user: IUser = {
    name: data['name'],
    email: data['email'],
    avatar: data['picture'],
    jwtToken: jwt_token,
    id: "0",
  }
  return res.status(200).send(user)
})

router.post('/credentials', async (req, res) => {
  /* Check if user exists in database */
  let foundUser = await getUser(req.body.email);

  if (!foundUser) {
    return res.status(401).send({ message: 'User does not exist' })
  }

  // Login with social media and haven't set password
  if (!foundUser.pass) {
    return res
      .status(401)
      .send({ message: "User not registered or signed in with social media" });
  }

  /* Check if password matches */
  if (comparePassword(req.body.password, foundUser.pass) === false) {
    return res.status(401).send({ message: "Password does not match" });
  }
  let jwtToken: string;
  try {
    jwtToken = await retrieveJwtToken({
      id: "0",
      mail: foundUser.mail,
      name: foundUser.name,
    });
  } catch (e) {
    return res.status(500).send({
      message: `Error occurred when retrieving jwtToken from server: ${
        e instanceof Error ? e.message : e
      }`,
    });
  }

  const user: IUser = {
    name: foundUser.name,
    email: foundUser.mail,
    avatar: foundUser.avatar,
    jwtToken: jwtToken,
    id: "0",
  };

  return res.status(200).send(user);
})

router.post('/register', async (req, res) => {
  /* Check if user exists in database */
  const foundUser = await getUser(req.body.email);
  if (foundUser) {
    return res.status(401).send({ message: 'User already exists' })
  }

  /* Create new user */
  /*
   * req.body = {
   *  name: string,
   *  mail: string,
   *  pass: string
   * }
   */
  try {
    const newUser = req.body as SqlUser;
    /* Default a unknown avatar */
    newUser.avatar =
      'https://t3.ftcdn.net/jpg/03/53/11/00/360_F_353110097_nbpmfn9iHlxef4EDIhXB1tdTD0lcWhG9.jpg'
    if (typeof newUser.pass === "string") {
      newUser.pass = encryptPassword(newUser.pass);
    }
    await createUser(newUser);
    return res.status(200).send({ message: 'User created' })
  } catch (err) {
    console.log(err)
    return res.status(500).send({ message: 'Error creating user' })
  }
})

router.get('/have-pass', async (req, res) => {
  if (typeof req.query.email !== "string") {
    return res.status(400).send({ err: "User not found" });
  }
  const foundUser = await getUser(req.query.email);
  if (!foundUser) return res.status(400).send({ err: 'User not found' })
  if (!foundUser.pass) return res.status(200).send({ havePass: false });
  return res.status(200).send({ havePass: true })
})

router.get('/verify', (req, res) => {
  const token = (req.headers.authorization as string).split(' ')[1]
  jwt.verify(token, JWT_SECRET, (err, _decoded) => {
    if (err) {
      /* console.log(err) */
      if (err.name == 'TokenExpiredError') {
        console.log('Token expired')
      }
      return res.send({ verified: false })
    } else {
      return res.send({ verified: true })
    }
  })
})

router.post('/forget-password', async (req, res) => {
  // TODO: 這個route目前因為Token的table尚未更新、依賴在新的資料庫中不存在的使用者id上，不能打
  /*
   * req.body = {
   * email: string
   * }
   */
  const user = await User.findOne({
    email: req.body.email,
  })
  if (!user) return res.status(200).send({ message: 'User not found' }) // status 200 because Nextjs expects 200
  if (!user.password) {
    return res
      .status(200)
      .send({ message: 'User not registered with credentials' })
  }
  let token = await Token.findOne({ userId: user._id })
  if (token) await token.deleteOne() // Delete existing token if exists

  let resetToken = crypto.randomBytes(32).toString('hex')
  await new Token({
    userId: user._id,
    email: user.email,
    token: resetToken,
    createdAt: Date.now(),
  }).save()
  const link = `http://localhost:3000/auth/reset-pass?token=${resetToken}&id=${user._id}`
  await sendMail(user.email, `Please reset your password here ${link}`)
  return res.status(200).send({ resetToken: resetToken, id: user._id })
})

router.post('/reset-password', async (req, res) => {
  // TODO: 這個route目前因為Token的table尚未更新、依賴在新的資料庫中不存在的使用者id上，不能打
  /* resetPassword(id, password, token) */
  const result = await resetPassword(
    req.body.id,
    req.body.password,
    req.body.token
  )
  if (result.error) return res.status(500).send({ message: result.error })
  res.status(200).send({ message: result.message })
})

router.patch('/update-password', async (req, res) => {
  // TODO: 這個route目前因為Token的table尚未更新、依賴在新的資料庫中不存在的使用者id上，不能打
  /*
   * req.body = {
   * id: string, // User id
   * oldPassword: string,
   * newPassword: string
   */
  try {
    const user = await User.findOne({ _id: req.body.id })
    if (!user) return res.status(401).send({ message: 'User not found' })

    user.comparePassword(
      req.body.oldPassword,
      async (err: any, isMatch: boolean) => {
        if (err)
          return res.status(500).send({ message: 'Error comparing password' })
        if (!isMatch)
          return res.status(401).send({ message: 'Password does not match' })
        user.password = req.body.newPassword
        await user.save()
        return res.status(200).send({ message: 'Password updated' })
      }
    )
  } catch (err) {
    console.log(err)
    res.send({ message: 'Error updating password' })
  }
})

export default router
