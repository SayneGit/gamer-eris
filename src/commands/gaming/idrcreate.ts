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
  const idrProfile = new Gamer.database.models.idlediscordrevolution({
    userID: message.author.id,
    lastUpdatedAt: Date.now()
  })
  idrProfile.save()

  const prefix = Gamer.guildPrefixes.get(message.guildID) || Gamer.prefix

  return Gamer.helpers.discord.embedResponse(
    message,
    language(`gaming/idrcreate:STARTED`, { emoji: constants.emojis.boosts, mention: message.author.mention, prefix })
  )
})
