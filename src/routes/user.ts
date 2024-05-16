import express from 'express'
import { jwtProtect } from './auth.utils' // Require Headers Authorization
import { getUser } from '../database/get'
import { patchLinks } from '../database/patch'
const router = express.Router()

router.get('/public-profile/:mail', async (req, res) => {
  if (!req.params.mail) return res.status(400).send({ error: 'Invalid mail' })
  const user = await getUser(req.params.mail)
  if (!user) return res.status(400).send({ error: 'User not found' })
  return res.status(200).send({
    name: user.name,
    email: user.mail,
    avatar: user.avatar,
    links: user.links,
  })
})

router.get('/profile-links', jwtProtect, async (req, res) => {
  const user = await getUser(req.body.decoded.mail)
  if (!user) return res.status(400).send({ error: 'User not found' })
  return res.status(200).send({
    links: user.links,
  })
})

router.patch('/profile-links', jwtProtect, async (req, res) => {
  /*
   * req.body = {
   *  modify: string,
   * }
   */
  if (!req.body.modify || typeof req.body.modify !== 'string')
    return res.status(400).send({ error: 'Invalid request body' })
  const patchRes = await patchLinks(req.body.decoded.mail, req.body.modify)
  if (!patchRes) return res.status(500).send({ error: 'Error patching links' })
  return res.status(200).send({ message: 'Links patched successfully' })
})

export default router
