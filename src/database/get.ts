import { query } from './index'

type User = {
  mail: string
  name: string
  pass: string
  avatar: string
  created_at: Date
  links: string[]
}
export async function getUser(mail: string): Promise<User> {
  const qString = 'select user_t.* from user_t where mail = $1'
  const res = await query(qString, [mail])
  return res.rows[0] as User
}
