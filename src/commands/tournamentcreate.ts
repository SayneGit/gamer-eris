import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import { milliseconds } from '../lib/types/enums/time'

export default new Command([`tournamentcreate`, `tc`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  const [name] = args
  const templateName = name ? name.toLowerCase() : undefined

  const tournaments = await Gamer.database.models.tournament.find({ guildID: message.channel.guild.id })
  const template = templateName ? tournaments.find(t => t.templateName === templateName) : undefined

  const startNow = (template ? template.minutesFromNow * milliseconds.MINUTE : milliseconds.WEEK) + Date.now()
  const payload = {
    id: Gamer.helpers.utils.createNewID(tournaments),
    creatorID: message.author.id,
    guildID: message.channel.guild.id,
    start: startNow,
    maxTeams: template?.maxTeams,
    hasStarted: false,
    adMessageID: undefined,
    createdAt: Date.now(),
    name: template?.name || language(`tournaments/tournamentcreate:DEFAULT_NAME`),
    platform: template?.platform || language(`events/eventcreate:DEFAULT_PLATFORM`),
    game: template?.game || language(`events/eventcreate:DEFAULT_GAME`),
    activity: template?.activity || language(`events/eventcreate:DEFAULT_ACTIVITY`),
    description: template?.description || language(`events/eventcreate:DEFAULT_DESCRIPTION`),
    allowedRoleIDs: template ? template.allowedRoleIDs : [],
    alertRoleIDs: template ? template.alertRoleIDs : [],
    teams: [],
    events: [],
    adChannelID: guildSettings?.channelIDs.tournaments
  }

  await Gamer.database.models.tournament.create(payload)

  // add new event to events array to be sent to amplitude for product analytics
  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: message.channel.guild.id,
    messageID: message.id,
    timestamp: message.timestamp,
    type: 'TOURNAMENT_CREATED'
  })

  // Let the user know it succeeded
  message.channel.createMessage(language(`tournaments/tournamentcreate:CREATE_SUCCESS`, { number: payload.id }))
  // Run the show command for this event so they can see the event details
  const tournamentshowCommand = Gamer.commandForName(`tournamentshow`)
  if (!tournamentshowCommand) return
  tournamentshowCommand.execute(message, [payload.id.toString()], context)

  const eventCreateCommand = Gamer.commandForName('eventcreate')
  if (!eventCreateCommand) return

  const eventIDs: number[] = []
  for (let i = 0; i < 7; i++) {
    const eventID = await Gamer.helpers.events.createNewEvent(
      message,
      i < 4 ? 'tourney1' : i < 6 ? 'tourney2' : 'tourney3',
      guildSettings
    )
    if (!eventID) continue
    eventIDs.push(eventID)

    const event = await Gamer.database.models.event.findOne({
      id: eventID,
      guildID: message.channel.guild.id
    })
    if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))
    // The event creator is auto-added so we force leave the event so only team players are in it
    event.attendees = []

    // Edit the title based on which match this is for
    switch (i) {
      case 0:
        event.title = 'Round 1 Match A'
        event.start = startNow
        break
      case 1:
        event.title = 'Round 1 Match B'
        event.start = startNow
        break
      case 2:
        event.title = 'Round 1 Match C'
        event.start = startNow
        break
      case 3:
        event.title = 'Round 1 Match D'
        event.start = startNow
        break
      case 4:
        event.title = 'Semi-Finals Match A'
        event.start = startNow + milliseconds.DAY
        break
      case 5:
        event.title = 'Semi-Finals Match B'
        event.start = startNow + milliseconds.DAY
        break
      case 6:
        event.title = 'Finals'
        event.start = startNow + milliseconds.DAY * 2
        break
    }

    event.save()
  }

  return message.channel.createMessage(
    language(`tournaments/tournamentcreate:EVENTS_CREATED`, { ids: eventIDs.join(', ') })
  )
})
