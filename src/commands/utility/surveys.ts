import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { sendMessage } from '../../lib/utils/eris'

export default new Command(`surveys`, async (message, _args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient

  const allSurveys = await Gamer.database.models.survey.find({ guildID: message.guildID })
  if (!allSurveys.length) return message.channel.createMessage(`utility/survey:NO_SURVEYS_FOUND`)

  return sendMessage(message.channel.id, allSurveys.map(s => s.name).join('\n'))
})
