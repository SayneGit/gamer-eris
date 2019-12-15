import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`tournamentadvertise`, `tad`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [number] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID) return helpCommand.execute(message, [`tournamentadvertise`], context)
  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: message.channel.guild.id
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  // Some channel names have odd characters that we need to handle
  const channelName = encodeURIComponent(message.channel.name)
  // If an old tournament card exists in a different channel get rid of it
  if (tournament.adChannelID && tournament.adMessageID && tournament.adChannelID !== message.channel.id) {
    Gamer.deleteMessage(tournament.adChannelID, tournament.adMessageID, `tournament card moved to ${channelName}`)
  }

  return
  // const channelID = message.channelMentions?.length ? message.channelMentions[0] : message.channel.id
  // return Gamer.helpers.tournaments.advertisetournament(tournament, channelID)
})
