import mongoose from 'mongoose'

export default new mongoose.Schema({
  id: String,
  // The message id also used as the unique identifier
  feedbackID: { type: String, required: true, index: true },
  // THe author id who sent the feedback
  authorID: { type: String, required: true },
  // The guid id where the feedback was sent
  guildID: { type: String, required: true },
  // The channel id where the feedback was sent
  channelID: { type: String, required: true },
  // The unique number identified for the feedback in that server.
  number: { type: Number, required: true },
  // Whether this feedback is a bug report
  isBugReport: { type: Boolean, required: true }
})

export interface GamerFeedback extends mongoose.Document {
  feedbackID: string
  authorID: string
  guildID: string
  channelID: string
  number: number
  isBugReport: boolean
}
