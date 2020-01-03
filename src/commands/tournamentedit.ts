import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`tournamentedit`, `te`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const guildID = message.channel.guild.id
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(guildID) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [number, type, ...fullValue] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID || !type) return helpCommand.process(message, [`tournamentedit`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: guildID
  })

  // toggles dont need a value
  if (!fullValue.length && ![`players`, `8`].includes(type.toLowerCase()))
    return helpCommand.process(message, [`tournamentedit`], context)
  const [value] = fullValue

  // Mods/admins are allowed to edit any tournament
  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: guildID
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  const roleID = message.roleMentions.length ? message.roleMentions[0] : value

  // First convert the numbers into its property names so that when we run the eventedit command to update this tournaments events we can update the correct properties because the #s in the event edit are different.
  let property = type.toLowerCase()
  switch (property) {
    case '1':
      property = 'title'
      break
    case '2':
      property = 'description'
      break
    case '3':
      property = 'platform'
      break
    case '4':
      property = 'game'
      break
    case '5':
      property = 'activity'
      break
    case '6':
      property = 'allowedrole'
      break
    case '7':
      property = 'alertrole'
      break
    case '8':
      property = 'players'
  }

  const role =
    message.channel.guild.roles.get(roleID) ||
    message.channel.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())

  const removedUserIDs: string[] = []
  let difference = 0
  let response = `tournaments/tournamentedit:TITLE_UPDATED`
  switch (property) {
    case `title`:
      tournament.name = fullValue.join(' ')
      break
    case `background`:
      if (!guildSettings?.vip.isVIP)
        return message.channel.createMessage(language(`tournaments/tournamentedit:VIP_BACKGROUND`))
      tournament.backgroundURL = value
      response = `tournaments/tournamentedit:BACKGROUND_UPDATED`
      break
    case `description`:
      tournament.description = fullValue.join(' ')
      response = `tournaments/tournamentedit:DESCRIPTION_UPDATED`
      break
    case `platform`:
      tournament.platform = fullValue.join(' ')
      response = `tournaments/tournamentedit:PLATFORM_UPDATED`
      break
    case `game`:
      tournament.game = fullValue.join(' ')
      response = `tournaments/tournamentedit:GAME_UPDATED`
      break
    case `activity`:
      tournament.activity = fullValue.join(' ')
      response = `tournaments/tournamentedit:ACTIVITY_UPDATED`
      break
    case `start`:
      const start = Gamer.helpers.transform.stringToMilliseconds(value)
      const startTime = new Date(fullValue.join(' ')).getTime()

      if (!start && !startTime) return helpCommand.process(message, [`tournamentedit`], context)

      const newStart = start ? Date.now() + start : startTime
      difference = tournament.start - newStart
      tournament.start = newStart
      response = `tournaments/tournamentedit:START_UPDATED`
      break
    case `allowedrole`:
      if (!role) return helpCommand.process(message, [`tournamentedit`], context)

      if (tournament.allowedRoleIDs.includes(role.id))
        tournament.allowedRoleIDs = tournament.allowedRoleIDs.filter(id => id !== role.id)
      else tournament.allowedRoleIDs.push(role.id)
      response = `tournaments/tournamentedit:ALLOWEDROLE_UPDATED`
      break
    case `alertrole`:
      if (!role) return helpCommand.process(message, [`tournamentedit`], context)

      if (tournament.alertRoleIDs.includes(role.id))
        tournament.alertRoleIDs = tournament.alertRoleIDs.filter(id => id !== role.id)
      else tournament.alertRoleIDs.push(role.id)
      response = `tournaments/tournamentedit:ALERTROLE_UPDATED`
      break
    case `players`:
      const maxPlayersPerTeam = parseInt(value, 10)
      if (!maxPlayersPerTeam) return
      // Update all teams with too many players
      for (const team of tournament.teams) {
        if (team.userIDs.length > maxPlayersPerTeam) removedUserIDs.push(...team.userIDs.splice(maxPlayersPerTeam))
      }
      tournament.playersPerTeam = maxPlayersPerTeam
      response = `tournaments/tournamentedit:PLAYERSPERTEAM`
      break
    // case `template`:
    //   tournament.templateName = value
    //   response = `tournaments/tournamentedit:TEMPLATE_UPDATED`
    //   break
    default:
      // If they used the command wrong show them the help
      return helpCommand.process(message, [`tournamentedit`], context)
  }

  // Save any change to the tournaments
  await tournament.save()
  message.channel.createMessage(language(response))

  const tournamentshowCommand = Gamer.commandForName(`tournamentshow`)
  if (!tournamentshowCommand) return

  tournamentshowCommand.process(message, [tournamentID.toString()], context)

  const eventeditCommand = Gamer.commandForName(`eventedit`)
  if (!eventeditCommand) return

  await Promise.all(
    tournament.eventIDs.map(async id => {
      const event = await Gamer.database.models.event.findOne({ id, guildID })
      if (!event) return

      switch (property) {
        case 'background':
          event.backgroundURL = value
          break
        case 'description':
          event.description = fullValue.join(' ')
          break
        case 'platform':
          event.platform = fullValue.join(' ')
          break
        case 'game':
          event.game = fullValue.join(' ')
          break
        case 'activity':
          event.activity = fullValue.join(' ')
          break
        case 'activity':
          event.activity = fullValue.join(' ')
          break
        case 'start':
          event.start += difference
          break
        case 'allowedrole':
          if (tournament.allowedRoleIDs.includes(role.id))
            tournament.allowedRoleIDs = tournament.allowedRoleIDs.filter(id => id !== role.id)
          else tournament.allowedRoleIDs.push(role.id)
          break
        case 'alertrole':
          if (tournament.alertRoleIDs.includes(role.id))
            tournament.alertRoleIDs = tournament.alertRoleIDs.filter(id => id !== role.id)
          else tournament.alertRoleIDs.push(role.id)
          break
        case 'players':
          const maxPlayersPerTeam = parseInt(value, 10)
          if (!maxPlayersPerTeam) return
          event.maxAttendees = maxPlayersPerTeam * tournament.maxTeams
          for (const userID of removedUserIDs) {
            // If this event does not have this user skip
            if (!event.attendees.includes(userID) && !event.waitingList.includes(userID)) continue
            // Remove the user from this event
            event.waitingList = event.waitingList.filter(w => w !== userID)
            event.attendees = event.attendees.filter(a => a !== userID)
          }
          break
      }

      await event.save()
      Gamer.helpers.events.advertiseEvent(event)
    })
  )
})
