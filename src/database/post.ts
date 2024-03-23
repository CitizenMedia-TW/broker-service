import { query } from './index'

type NewUser = {
  name: string
  mail: string
  avatar: string
  pass?: string
}
export async function createUser(newUser: NewUser) {
  if (!newUser.pass) {
    const qString =
      'insert into user_t (name, mail, avatar) values ($1, $2, $3) returning *'
    const res = await query(qString, [
      newUser.name,
      newUser.mail,
      newUser.avatar,
    ])
    if (res.rowCount == 0) return { error: 'User not created' }
    return {
      mail: res.rows[0].mail,
      name: res.rows[0].name,
      avatar: res.rows[0].avatar,
    }
  }
  const qString =
    'insert into user_t (name, mail, avatar, pass) values ($1, $2, $3, $4) returning *'
  const res = await query(qString, [
    newUser.name,
    newUser.mail,
    newUser.avatar,
    newUser.pass,
  ])
  if (res.rowCount == 0) return { error: 'User not created' }
  return {
    mail: res.rows[0].mail,
    name: res.rows[0].name,
    avatar: res.rows[0].avatar,
  }
}
