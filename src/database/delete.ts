import { query } from './index'

export async function deleteUser(mail: string) {
  const qString = 'delete from user_t where mail = $1'
  const res = await query(qString, [mail])
  if (res.rowCount == 0) return { error: 'User not found' }
  return { message: 'User deleted' }
}
