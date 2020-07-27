import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command([`settag`, `settags`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')

  const guildSettings = await upsertGuild(message.guildID)

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type, name] = args
  if (!type) return helpCommand?.execute(message, [`settags`], { ...context, commandName: 'help' })

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    case `mail`:
      if (!name) return helpCommand?.execute(message, [`settags`], { ...context, commandName: 'help' })
      const tagToEdit = await Gamer.database.models.tag.findOne({
        name: name.toLowerCase(),
        guildID: message.guildID
      })
      if (!tagToEdit) return message.channel.createMessage(language(`settings/settags:INVALID_NAME`, { name }))

      tagToEdit.mailOnly = !tagToEdit.mailOnly
      tagToEdit.save()
      return message.channel.createMessage(language(`settings/settags:TOGGLED_MAIL`, { name }))
    case `channel`:
      if (!message.channelMentions.length)
        return helpCommand?.execute(message, [`settags`], { ...context, commandName: 'help' })

      for (const channelID of message.channelMentions) {
        if (guildSettings.tags.disabledChannels.includes(channelID))
          guildSettings.tags.disabledChannels = guildSettings.tags.disabledChannels.filter(id => id !== channelID)
        else guildSettings.tags.disabledChannels.push(channelID)
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/settags:UPDATED_CHANNELS`))
  }

  return helpCommand?.execute(message, [`setfeedback`], { ...context, commandName: 'help' })
})
