import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`idrdelete`, `idrd`], async (message, _args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  Gamer.database.models.idlediscordrevolution.deleteOne({ userID: message.author.id }).exec()

  return message.channel.createMessage(language(`gaming/idrdelete:DELETED`))
})
