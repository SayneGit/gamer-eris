import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true }
})

export interface GamerIdleDiscordRevolution extends mongoose.Document {
  userID: string
}
