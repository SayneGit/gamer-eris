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

  if (!tournamentID || !type) return helpCommand.execute(message, [`tournamentedit`], context)

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

  // const roleID = message.roleMentions.length ? message.roleMentions[0] : value

  let response = `tournaments/tournamentedit:TITLE_UPDATED`
  switch (type.toLowerCase()) {
    case `background`:
      if (!guildSettings?.vip.isVIP)
        return message.channel.createMessage(language(`tournaments/tournamentedit:VIP_BACKGROUND`))
      tournament.backgroundURL = value
      response = `tournaments/tournamentedit:BACKGROUND_UPDATED`
      break
    // case `title`:
    // case `1`:
    //   tournament.title = fullValue.join(' ')
    //   break
    // case `description`:
    // case `2`:
    //   tournament.description = fullValue.join(' ')
    //   response = `tournaments/tournamentedit:DESCRIPTION_UPDATED`
    //   break
    // case `platform`:
    // case `5`:
    //   tournament.platform = fullValue.join(' ')
    //   response = `tournaments/tournamentedit:PLATFORM_UPDATED`
    //   break
    // case `game`:
    // case `6`:
    //   tournament.game = fullValue.join(' ')
    //   response = `tournaments/tournamentedit:GAME_UPDATED`
    //   break
    // case `activity`:
    // case `7`:
    //   tournament.activity = fullValue.join(' ')
    //   response = `tournaments/tournamentedit:ACTIVITY_UPDATED`
    //   break
    // case `tags`:
    //   const tagName = value.toLowerCase()
    //   const exists = tournament.tags.includes(tagName)
    //   if (exists) tournament.tags = tournament.tags.filter(tag => tag === tagName)
    //   else tournament.tags.push(tagName)
    //   response = `tournaments/tournamentedit:TAGS_UPDATED`
    //   break
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
    //   if (!reminder) return helpCommand.execute(message, [`tournamentedit`], context)

    //   if (tournament.reminders.includes(reminder))
    //     tournament.reminders = tournament.reminders.filter(r => r === reminder)
    //   else tournament.reminders.push(reminder)
    //   response = `tournaments/tournamentedit:REMINDERS_UPDATED`
    //   break
    // case `frequency`:
    //   const frequency = Gamer.helpers.transform.stringToMilliseconds(value)
    //   if (!frequency) return helpCommand.execute(message, [`tournamentedit`], context)

    //   tournament.frequency = frequency
    //   response = `tournaments/tournamentedit:FREQUENCY_UPDATED`
    //   break
    // case `duration`:
    // case `3`:
    //   const duration = Gamer.helpers.transform.stringToMilliseconds(value)
    //   if (!duration) return helpCommand.execute(message, [`tournamentedit`], context)

    //   tournament.duration = duration
    //   tournament.end = tournament.start + tournament.duration
    //   response = `tournaments/tournamentedit:DURATION_UPDATED`
    //   break
    // case `start`:
    // case `11`:
    //   const start = Gamer.helpers.transform.stringToMilliseconds(value)
    //   const startTime = new Date(fullValue.join(' ')).getTime()

    //   if (!start && !startTime) return helpCommand.execute(message, [`tournamentedit`], context)

    //   tournament.start = start ? Date.now() + start : startTime
    //   tournament.end = tournament.start + tournament.duration
    //   response = `tournaments/tournamentedit:START_UPDATED`
    //   break
    // case `allowedrole`:
    // case `9`:
    //   const allowedRole =
    //     message.channel.guild.roles.get(roleID) ||
    //     message.channel.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
    //   if (!allowedRole) return helpCommand.execute(message, [`tournamentedit`], context)

    //   if (tournament.allowedRoleIDs.includes(allowedRole.id))
    //     tournament.allowedRoleIDs = tournament.allowedRoleIDs.filter(id => id !== allowedRole.id)
    //   else tournament.allowedRoleIDs.push(allowedRole.id)
    //   response = `tournaments/tournamentedit:ALLOWEDROLE_UPDATED`
    //   break
    // case `alertrole`:
    // case `10`:
    //   const roleToAlert =
    //     message.channel.guild.roles.get(roleID) ||
    //     message.channel.guild.roles.find(r => r.name.toLowerCase() === fullValue.join(' ').toLowerCase())
    //   if (!roleToAlert) return helpCommand.execute(message, [`tournamentedit`], context)

    //   if (tournament.alertRoleIDs.includes(roleToAlert.id))
    //     tournament.alertRoleIDs = tournament.alertRoleIDs.filter(id => id !== roleToAlert.id)
    //   else tournament.alertRoleIDs.push(roleToAlert.id)
    //   response = `tournaments/tournamentedit:ALERTROLE_UPDATED`
    //   break

    // case `template`:
    //   tournament.templateName = value
    //   response = `tournaments/tournamentedit:TEMPLATE_UPDATED`
    //   break
    default:
      // If they used the command wrong show them the help
      return helpCommand.execute(message, [`tournamentedit`], context)
  }

  // Save any change to the tournaments
  tournament.save()
  message.channel.createMessage(language(response))

  const tournamentshowCommand = Gamer.commandForName(`tournamentshow`)
  if (!tournamentshowCommand) return

  return tournamentshowCommand.execute(message, [tournamentID.toString()], context)
})
