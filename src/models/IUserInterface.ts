import mongoose from 'mongoose'
import { Model } from 'mongoose'

export interface IUser extends mongoose.Document {
  username: string
  email: string
  password: string
  avatar: string
  myStories: mongoose.Types.ObjectId[]
  likedStories: mongoose.Types.ObjectId[]
  profileLinks: string[]
  date: Date
}

export interface IUserMethods extends Model<IUser> {
  comparePassword(password: string, callback: Function): Promise<Function>
}
