import express from 'express'
import { User } from '@/src/models'
import { jwt_protect } from './auth.utils' // Require Headers Authorization
const router = express.Router()

router.get('/public-profile/:id', async (req, res) => {
  const user = await User.findOne({ _id: req.params.id })
  if (!user) return res.status(400).send({ error: 'User not found' })
  return res.status(200).send({
    name: user.username,
    email: user.email,
    avatar: user.avatar,
    profileLinks: user.profileLinks,
  })
})

router.get('/profile-links', jwt_protect, async (req, res) => {
  const user = await User.findOne({ _id: req.body.decoded.id })
  if (!user) return res.status(400).send({ error: 'User not found' })
  return res.status(200).send({ profileLinks: user.profileLinks ?? {} })
})

router.post('/profile-links', jwt_protect, async (req, res) => {
  /*
   * req.body = {
   *  profileLinks: {
   *   string: string // Leave empty string to delete
   *  }
   * }
   */
  const user = await User.findOne({ _id: req.body.decoded.id })
  if (!user) return res.status(400).send({ error: 'User not found' })

  if (!req.body.profileLinks)
    return res.send({ error: 'No profile links provided' })

  user.profileLinks = user.profileLinks || {}
  Object.keys(req.body.profileLinks).forEach((key) => {
    if (req.body.profileLinks[key] === '') user.profileLinks.delete(key)
    else user.profileLinks.set(key, req.body.profileLinks[key])
  })

  const saved = await user.save()
  if (!saved) return res.status(400).send({ error: 'Error saving user' })
  return res.status(200).send({ profileLinks: user.profileLinks })
})

export default router
