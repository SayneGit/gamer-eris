import mongoose from 'mongoose'
import { milliseconds } from '../../lib/types/enums/time'

export default new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: Number, required: true },
  creatorID: { type: String, required: true },
  minutesFromNow: { type: Number, default: milliseconds.WEEK },
  templateName: { type: String, lowercase: true },
  start: { type: Number, required: true },
  maxTeams: { type: Number, default: 8 },
  hasStarted: Boolean,
  platform: { type: String, required: true },
  game: { type: String, required: true },
  activity: { type: String, required: true },
  description: { type: String, required: true },
  allowedRoleIDs: [String],
  alertRoleIDs: [String],
  adChannelID: String,
  adMessageID: String,
  teams: [
    {
      name: String,
      userIDs: [String]
    }
  ],
  eventIDs: [Number],
  playersPerTeam: { type: Number, default: 5 },
  guildID: { type: String, required: true },
  backgroundURL: String
})

export interface GamerTournament extends mongoose.Document {
  /** The name of the tournament. This will also be used in the title of the events */
  name: string
  /** The unique id of the tournament in the server. Used for editing the tourney. */
  id: number
  /** The user id of the person who created the tourney */
  creatorID: string
  /** The amount of minutes from creation of the tournament that it will start. */
  minutesFromNow: number
  /** The name of the template if this tournament should be a template */
  templateName?: string
  /** The start time for this event */
  start: number
  /** The max amount of teams allowed */
  maxTeams: number
  /** Whether or not the tournament is open to registration */
  hasStarted: boolean
  /** A custom string that users can set for their tournament */
  platform: string
  /** A custom string that users can set for their tournament */
  game: string
  /** A custom string that users can set for their tournament */
  activity: string
  /** A custom string that users can set for their tournament */
  description: string
  /** The roles that are required to participate in the tournament. For example, need NA role to play. */
  allowedRoleIDs: string[]
  /** The roles that will be @ mentioned when the tourney starts */
  alertRoleIDs: string[]
  /** The channel id where the brackets are being saved. */
  adChannelID: string
  /** The message id of the brackets image. */
  adMessageID: string
  /** The teams that are currently registered to play in the tournament */
  teams: Team[]
  /**  The event ids that are related to this tournament. */
  eventIDs: number[]
  /** The amount of players per team. For example, this will determine 5v5 */
  playersPerTeam: number
  /** The url string for VIP servers to set a custom background image */
  backgroundURL?: string
}

export interface Team {
  /** The name of the team. */
  name: string
  /** The user ids of the players that are in this team. */
  userIDs: string[]
}
