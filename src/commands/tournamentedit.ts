import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`tournamentedit`, `te`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [number, type, ...fullValue] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID || !type) return helpCommand.process(message, [`tournamentedit`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // toggles dont need a value
  if (!fullValue.length && ![`repeat`, `remove`, `dm`, `dms`, `showattendees`].includes(type.toLowerCase())) return
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
    guildID: message.channel.guild.id
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID_TOURNAMENT`))

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
  }

  let response = `tournaments/tournamentedit:TITLE_UPDATED`
  switch (type.toLowerCase()) {
    case `title`:
    case `1`:
      tournament.name = fullValue.join(' ')
      break
    case `background`:
      if (!guildSettings?.vip.isVIP)
        return message.channel.createMessage(language(`tournaments/tournamentedit:VIP_BACKGROUND`))
      tournament.backgroundURL = value
      response = `tournaments/tournamentedit:BACKGROUND_UPDATED`
      break
    case `description`:
    case `2`:
      tournament.description = fullValue.join(' ')
      response = `tournaments/tournamentedit:DESCRIPTION_UPDATED`
      break
    case `platform`:
    case `3`:
      tournament.platform = fullValue.join(' ')
      response = `tournaments/tournamentedit:PLATFORM_UPDATED`
      break
    case `game`:
    case `4`:
      tournament.game = fullValue.join(' ')
      response = `tournaments/tournamentedit:GAME_UPDATED`
      break
    case `activity`:
    case `5`:
      tournament.activity = fullValue.join(' ')
      response = `tournaments/tournamentedit:ACTIVITY_UPDATED`
      break
    // case `attendees`:
    // case `4`:
    //   const maxAttendees = parseInt(value, 10)
    //   if (!maxAttendees) return
    //   while (tournament.attendees.length < maxAttendees && tournament.waitingList.length)
    //     Gamer.helpers.tournaments.transferFromWaitingList(tournament)
    //   tournament.maxAttendees = maxAttendees
    //   response = `tournaments/tournamentedit:ATTENDEES_UPDATED`
    //   break
    // case `repeat`:
    //   tournament.isRecurring = !tournament.isRecurring
    //   response = `tournaments/tournamentedit:REPEAT_UPDATED`
    //   break
    // case `remove`:
    //   tournament.removeRecurringAttendees = !tournament.removeRecurringAttendees
    //   response = `tournaments/tournamentedit:REMOVE_UPDATED`
    //   break
    // case `dm`:
    // case `dms`:
    // case `8`:
    //   tournament.dmReminders = !tournament.dmReminders
    //   response = `tournaments/tournamentedit:DM_UPDATED`
    //   break
    // case `showattendees`:
    //   tournament.showAttendees = !tournament.showAttendees
    //   response = `tournaments/tournamentedit:SHOWATTENDEES_UPDATED`
    //   break
    // case `reminder`:
    //   const reminder = Gamer.helpers.transform.stringToMilliseconds(value)
    //   if (!reminder) return helpCommand.process(message, [`tournamentedit`], context)

    //   if (tournament.reminders.includes(reminder))
    //     tournament.reminders = tournament.reminders.filter(r => r === reminder)
    //   else tournament.reminders.push(reminder)
    //   response = `tournaments/tournamentedit:REMINDERS_UPDATED`
    //   break
    // case `frequency`:
    //   const frequency = Gamer.helpers.transform.stringToMilliseconds(value)
    //   if (!frequency) return helpCommand.process(message, [`tournamentedit`], context)

    //   tournament.frequency = frequency
    //   response = `tournaments/tournamentedit:FREQUENCY_UPDATED`
    //   break
    // case `duration`:
    // case `3`:
    //   const duration = Gamer.helpers.transform.stringToMilliseconds(value)
    //   if (!duration) return helpCommand.process(message, [`tournamentedit`], context)

    //   tournament.duration = duration
    //   tournament.end = tournament.start + tournament.duration
    //   response = `tournaments/tournamentedit:DURATION_UPDATED`
    //   break
    // case `start`:
    // case `11`:
    //   const start = Gamer.helpers.transform.stringToMilliseconds(value)
    //   const startTime = new Date(fullValue.join(' ')).getTime()

    //   if (!start && !startTime) return helpCommand.process(message, [`tournamentedit`], context)

    //   tournament.start = start ? Date.now() + start : startTime
    //   tournament.end = tournament.start + tournament.duration
    //   response = `tournaments/tournamentedit:START_UPDATED`
    //   break
    case `allowedrole`:
    case `6`:
      const allowedRole =
        message.channel.guild.roles.get(roleID) ||
        message.channel.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
      if (!allowedRole) return helpCommand.process(message, [`tournamentedit`], context)

      if (tournament.allowedRoleIDs.includes(allowedRole.id))
        tournament.allowedRoleIDs = tournament.allowedRoleIDs.filter(id => id !== allowedRole.id)
      else tournament.allowedRoleIDs.push(allowedRole.id)
      response = `tournaments/tournamentedit:ALLOWEDROLE_UPDATED`
      break
    case `alertrole`:
    case `7`:
      const roleToAlert =
        message.channel.guild.roles.get(roleID) ||
        message.channel.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
      if (!roleToAlert) return helpCommand.process(message, [`tournamentedit`], context)

      if (tournament.alertRoleIDs.includes(roleToAlert.id))
        tournament.alertRoleIDs = tournament.alertRoleIDs.filter(id => id !== roleToAlert.id)
      else tournament.alertRoleIDs.push(roleToAlert.id)
      response = `tournaments/tournamentedit:ALERTROLE_UPDATED`
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

  for (const event of tournament)
})
