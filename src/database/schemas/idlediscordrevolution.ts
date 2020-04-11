import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  currency: { type: Number, default: 10 },
  prestigeMultiplier: { type: Number, default: 1 }
})

export interface GamerIdleDiscordRevolution extends mongoose.Document {
  userID: string
  currency: number
  prestigeMultiplier: number
}
