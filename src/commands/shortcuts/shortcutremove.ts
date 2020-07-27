import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`shortcutremove`, `shortcutdelete`, `scd`, `scr`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name] = args
  if (!name) return helpCommand?.execute(message, [`shortcutremove`], { ...context, commandName: 'help' })

  const deleted = await Gamer.database.models.shortcut.findOneAndDelete({
    guildID: message.guildID,
    name: name.toLowerCase()
  })

  if (!deleted) return message.channel.createMessage(language(`shortcuts/shortcutremove:INVALID_NAME`, { name }))

  return message.channel.createMessage(language(`shortcuts/shortcutremove:DELETED`))
})
