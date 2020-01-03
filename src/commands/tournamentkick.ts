import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`tournamentkick`, `tkick`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const guildID = message.channel.guild.id

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(guildID) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [number, teamName] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID) return helpCommand.process(message, [`tournamentkick`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: guildID
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: guildID
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  message.channel.createMessage(language(`tournaments/tournamentkick:PATIENCE`))

  const team = tournament.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase())
  if (!team) return message.channel.createMessage(language(`tournaments/tournamentkick:INVALID_TEAM`))

  // Remove the team from the tournament
  tournament.teams = tournament.teams.filter(t => t.name.toLowerCase() !== teamName.toLowerCase())
  tournament.save()

  // Remove the users from all the events in this tournament
  await Promise.all(
    tournament.eventIDs.map(async id => {
      const event = await Gamer.database.models.event.findOne({ id, guildID })
      if (!event) return

      for (const userID of team.userIDs) {
        // If this event does not have this user skip
        if (!event.attendees.includes(userID) && !event.waitingList.includes(userID)) continue
        // Remove the user from this event
        event.waitingList = event.waitingList.filter(w => w !== userID)
        event.attendees = event.attendees.filter(a => a !== userID)
      }
      event.save()
    })
  )

  return message.channel.createMessage(language(`tournaments/tournamentkick:KICKED`))
})
