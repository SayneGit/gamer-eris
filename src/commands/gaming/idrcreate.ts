import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

export default new Command([`idrcreate`, `idrc`], async (message, _args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // TODO: Not sure how to handle profiles yet
  const exists = await Gamer.database.models.idlediscordrevolution.findOne({ userID: message.author.id })
  if (exists) return message.channel.createMessage(language(`gaming/idrcreate:EXISTS`))

  // Create the database object
  Gamer.database.models.idlediscordrevolution.create({ userID: message.author.id })
  const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix

  return message.channel.createMessage(
    language(`gaming/idrcreate:STARTED`, { emoji: constants.emojis.boosts, mention: message.author.mention, prefix })
  )
})
