import { query } from './index'

export async function patchLinks(
  mail: string,
  link: string
): Promise<string[]> {
  // Remove the link if it exists, otherwise add it
  const exists = await query(
    'select user_t.links from user_t where mail = $1 and $2::varchar(255) = any(links)',
    [mail, link]
  )
  // Link doesn't exist, append
  if (exists.rowCount == 0) {
    const res = await query(
      'update user_t set links = array_append(links, $2) where mail = $1 returning links',
      [mail, link]
    )
    return res.rows[0].links
  }
  // Link exists, remove
  const res = await query(
    'update user_t set links = array_remove(links, $2) where mail = $1 returning links',
    [mail, link]
  )
  return res.rows[0].links
}
