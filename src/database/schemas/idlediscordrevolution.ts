import mongoose from 'mongoose'

export default new mongoose.Schema({
  userID: { type: String, required: true, index: true },
  currency: { type: Number, default: 10 },
  prestigeMultiplier: { type: Number, default: 1 },
  lastUpdatedAt: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  servers: { type: Number, default: 0 },
  invites: { type: Number, default: 0 }
})

export interface GamerIdleDiscordRevolution extends mongoose.Document {
  userID: string
  currency: number
  lastUpdatedAt: number
  prestigeMultiplier: number
  friends: number
  servers: number
  invites: number
}
