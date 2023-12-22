/* Get the JWT_SECRET from the .env file and export it */
import 'dotenv/config'

export const JWT_SECRET = process.env.JWT_SECRET as string
if (!JWT_SECRET || JWT_SECRET == '') {
  throw new Error('JWT_SECRET not defined')
}
