import nodemailer from 'nodemailer'
import bcrypt from 'bcrypt'
import express from 'express'
import * as grpc from "@grpc/grpc-js"
import { User, Token } from '@/src/models'
import * as auth_service from '@/protobuffs/auth-service/auth-service'
import { env } from '../utils/dotenv'

const MAIL_HOST = process.env.MAIL_HOST
const MAIL_USER = process.env.MAIL_USER
const MAIL_PASS = process.env.MAIL_PASS
const authClient = new auth_service.AuthServiceClient(env.AUTH_SERVICE_URL, grpc.ChannelCredentials.createInsecure())

export async function sendMail(email: string, content: string): Promise<void> {
  const config = {
    service: MAIL_HOST,
    port: 465,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  }
  const transporter = nodemailer.createTransport(config)
  const options = () => {
    return {
      from: 'virtualbazaar.22.08@gmail.com',
      to: email,
      subject: 'Hello ✔',
      html: `<p>${content}</p>`,
    }
  }
  transporter.sendMail(options(), (error, _info) => {
    if (error) {
      console.log(error)
    } else {
      /* console.log(info) */
      /* console.log('Email sent: ' + info.response) */
    }
  })

  return
}

export async function resetPassword(
  id: string,
  password: string,
  token: string
) {
  const user = await Token.findOne({ userId: id })
  if (!user) return { error: 'User not found' }

  const isValid = await bcrypt.compare(token, user.token as string)
  if (!isValid) return { error: 'Token is invalid' }

  password = await bcrypt.hash(password, 10)
  await User.updateOne({ _id: id }, { $set: { password: password } })

  console.log(user)
  await sendMail(user.email, 'Your password has been reset')
  await user.deleteOne()

  return { message: 'Password reset successfully' }
}

export function jwtProtect(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log('Checking JWT')
  if (!req.headers.authorization)
    return res.send({ message: 'No token provided', verified: false })

  const token = req.headers.authorization;
  authClient.verifyToken({ token: token }, (err, response) => {
    if (err) {
      console.warn("Error occurred when verifying JWT:" + err.message);
      return res
        .status(500)
        .send({ message: "Error occurred when verifying JWT" });
    }
    if (response.message === "Failed" || response.jwtContent === undefined) {
      return res
        .status(400)
        .send({ error: "Verify not pass", verified: false });
    }
    req.body.decoded = response.jwtContent;
    next();
  });
}

export async function retrieveJwtToken(
  genTokenReq: auth_service.GenerateTokenRequest
) {
  return new Promise((resolve: (jwtToken: string) => void, reject) => {
    authClient.generateToken(genTokenReq, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response.token);
      }
    });
  });
}