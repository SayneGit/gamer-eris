import mongoose from 'mongoose'

export default new mongoose.Schema({
  guildID: { type: String, required: true },
  memberID: { type: String, required: true },
}).index({ memberID: 1, guildID: 1 })

export interface GamerIdleDiscordRevolution extends mongoose.Document {
  userID: string
  guildID: string
}
