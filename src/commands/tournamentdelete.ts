import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`tournamentdelete`, `td`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [number] = args
  const tournamentID = parseInt(number, 10)
  if (!tournamentID) return helpCommand.process(message, [`tournamentdelete`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: message.channel.guild.id
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  // Delete the tournament ad as well
  const tournamentMessage =
    tournament.adChannelID && tournament.adMessageID
      ? await Gamer.getMessage(tournament.adChannelID, tournament.adMessageID).catch(() => undefined)
      : undefined
  if (tournamentMessage) tournamentMessage.delete().catch(() => undefined)

  const eventdeleteCommand = Gamer.commandForName('eventdelete')
  if (!eventdeleteCommand) return

  // Delete all events that were associciated with this tournament
  for (const id of tournament.eventIDs) eventdeleteCommand.process(message, [id.toString()], context)
  // Delete the tournament itself from the database
  await Gamer.database.models.tournament.deleteOne({ _id: tournament._id })
  // Let the user know it was deleted
  return message.channel.createMessage(language(`tournaments/tournamentdelete:DELETE`, { id: tournament.id }))
})
