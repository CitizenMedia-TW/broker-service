/* Get the environment variables from the .env file and export them */
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET as string
if (!JWT_SECRET || JWT_SECRET == '') throw new Error('JWT_SECRET not defined')

const MAIL_HOST = process.env.MAIL_HOST as string
const MAIL_USER = process.env.MAIL_USER as string
const MAIL_PASS = process.env.MAIL_PASS as string
if (!MAIL_HOST || MAIL_HOST == '') throw new Error('MAIL_HOST not defined')
if (!MAIL_USER || MAIL_USER == '') throw new Error('MAIL_USER not defined')
if (!MAIL_PASS || MAIL_PASS == '') throw new Error('MAIL_PASS not defined')

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string
if (!AUTH_SERVICE_URL || AUTH_SERVICE_URL == '')
  throw new Error('AUTH_SERVICE_URL not defined')

const DATABASE_URL = process.env.DATABASE_URL as string
if (!DATABASE_URL || DATABASE_URL == '')
  throw new Error('DATABASE_URL not defined')

export const env = {
  JWT_SECRET,
  MAIL_HOST,
  MAIL_USER,
  MAIL_PASS,
  AUTH_SERVICE_URL,
  DATABASE_URL,
}
