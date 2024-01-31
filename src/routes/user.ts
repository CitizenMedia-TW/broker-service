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
   *  remove: string[],
   *  add: string[]
   * }
   */
  const user = await User.findOne({ _id: req.body.decoded.id })
  if (!user) return res.status(400).send({ error: 'User not found' })

  if (req.body.remove) {
    req.body.remove.forEach((link: string) => {
      const index = user.profileLinks.indexOf(link)
      if (index == -1) return // If link doesn't exists
      user.profileLinks.splice(index, 1)
    })
  }

  if (req.body.add) {
    req.body.add.forEach((link: string) => {
      const index = user.profileLinks.indexOf(link)
      if (index != -1) return // If link already exists
      user.profileLinks.push(link)
    })
  }

  const saved = await user.save()
  if (!saved) return res.status(400).send({ error: 'Error saving user' })
  return res.status(200).send({ profileLinks: user.profileLinks })
})

export default router
