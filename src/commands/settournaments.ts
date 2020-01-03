import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`settournaments`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  let guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  if (!guildSettings) guildSettings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const [action] = args
  if (!action) return helpCommand.process(message, [`settournaments`], context)

  const [channelID] = message.channelMentions

  switch (action.toLowerCase()) {
    case 'adchannel':
      guildSettings.channelIDs.tournamentAdvertisements = channelID
      guildSettings.save()
      return message.channel.createMessage(
        language(channelID ? `settings/settournaments:SET_ADCHANNEL` : `settings/settournaments:RESET_ADCHANNEL`, {
          channel: `<#${channelID}>`
        })
      )
    case 'resultchannel':
    case 'resultschannel':
      guildSettings.channelIDs.tournamentResults = channelID
      guildSettings.save()
      return message.channel.createMessage(
        language(
          channelID ? `settings/settournaments:SET_RESULTCHANNEL` : `settings/settournaments:RESET_RESULTCHANNEL`,
          {
            channel: `<#${channelID}>`
          }
        )
      )
  }

  return helpCommand.process(message, [`settournaments`], context)
})
