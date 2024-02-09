import express from 'express'
import * as grpc from '@grpc/grpc-js'
import { jwt_protect } from './auth.utils'
import { User } from '@/src/models'
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb'

const router = express.Router()
const PROTO_PATH =
  __dirname + '/../../protobuffs/story-service/story-service.proto'
const protoLoader = require('@grpc/proto-loader')
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const storyProto = grpc.loadPackageDefinition(packageDefinition).story
const client = new storyProto.StoryService(
  'localhost:50051',
  grpc.credentials.createInsecure()
)

// Retrieve story by its id
router.get('/retrieve-by-id', (req, res) => {
  const id = req.query.id
  client.getOneStory({ storyId: id }, (err, response) => {
    if (err) return res.send(err)
    const story = response
    console.log(story)
    console.log()
    return res.send(story)
  })
})

router.get('/preview', (req, res) => {
  const id = req.query.id
  client.getOneStory({ storyId: id }, (err, response) => {
    if (err) return
    return res.send({
      title: response.title,
      subTitle: response.subTitle,
      author: response.author,
      createdAt: response.createdAt,
    })
  })
})

function toDate(timestamp) {
  return new Date(timestamp.seconds * 1000 + timestamp.nanos / 1e6)
}
async function previewStory(id) {
  // var d = new Date(timestamp.seconds.low);
  // d.setMilliseconds(timestamp.nanos / 1e6);
  // console.log (d.toISOString());
  return new Promise((resolve, reject) => {
    client.getOneStory({ storyId: id }, (err, response) => {
      if (err) return reject(err)
      return resolve({
        id: id,
        title: response.title,
        subTitle: response.subTitle,
        author: response.author,
        createdAt: toDate(response.createdAt),
        tags: response.tags,
      })
    })
  })
}

// Retrieve list of story id by its author
router.get('/retrieve', jwt_protect, async (req, res) => {
  const userId = req.body.decoded.id
  await client.getRecommended({ userId: userId }, (err, response) => {
    if (err) return res.send(err)
    const list = response.storyIdList
    let listOfStories = []
    list.forEach(async (id) => {
      const story = await previewStory(id)
      listOfStories.push(story)
      if (listOfStories.length === list.length) {
        console.log(listOfStories)
        return res.send(listOfStories)
      }
    })
    // console.log(list)
    // return res.send(list)
  })
})

// Create a new story
router.post('/create', jwt_protect, async (req, res) => {
  /*
   * req.body = {
   *  content: string,
   *  title: string,
   *  subTitle: string,
   *  tags: string[],
   * }
   */
  const user = await User.findOne({ _id: req.body.decoded.id })
  if (!user) return res.status(400).send('User not found')
  const createStoryRequest = {
    author: user.username,
    authorId: user._id,
    content: req.body.content,
    title: req.body.title,
    subTitle: req.body.subTitle,
    tags: req.body.tags,
  }
  client.createStory(createStoryRequest, (err, response) => {
    if (err) return res.send(err)
    return res
      .status(200)
      .send({ message: response.message, storyId: response.storyId })
  })
})

router.get('/get-recommended', (req, res) => {
  const userId = req.query.id
  client.getRecommended({ userId: userId }, (err, response) => {
    if (err) return res.send(err)
    const list = response.storyIdList
    let listOfStories = []
    list.forEach(async (id) => {
      const story = await previewStory(id)
      listOfStories.push(story)
      if (listOfStories.length === list.length) {
        console.log(listOfStories)
        return res.send(listOfStories)
      }
    })
  })
})

module.exports = { grpcStoryRoute: router }
