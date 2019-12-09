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
  const templateName = name.toLowerCase()

  const tournaments = await Gamer.database.models.tournament.find({ guildID: message.channel.guild.id })
  const template = tournaments.find(t => t.templateName === templateName)

  const startNow = (template ? template.minutesFromNow * milliseconds.MINUTE : milliseconds.WEEK) + Date.now()

  const payload = {
    id: Gamer.helpers.utils.createNewID(tournaments),
    creatorID: message.author.id,
    guildID: message.channel.guild.id,
    start: startNow,
    maxTeams: template?.maxTeams,
    hasStarted: false,
    adMessageID: undefined,
    adChannelID: guildSettings?.eventsAdvertiseChannelID,
    createdAt: Date.now(),
    platform: template?.platform || language(`events/eventcreate:DEFAULT_PLATFORM`),
    game: template?.game || language(`events/eventcreate:DEFAULT_GAME`),
    activity: template?.activity || language(`events/eventcreate:DEFAULT_ACTIVITY`),
    description: template?.description || language(`events/eventcreate:DEFAULT_DESCRIPTION`),
    allowedRoleIDs: template ? template.allowedRoleIDs : [],
    alertRoleIDs: template ? template.alertRoleIDs : [],
    teams: [],
    events: []
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
  message.channel.createMessage(language(`events/tournamentcreate:CREATE_SUCCESS`, { number: payload.id }))
  // Run the show command for this event so they can see the event details
  const tournamentshowCommand = Gamer.commandForName(`tournamentshow`)
  if (!tournamentshowCommand) return
  tournamentshowCommand.execute(message, [payload.id.toString()], context)

  const tournament = await Gamer.database.models.event.findOne({
    id: payload.id,
    guildID: message.channel.guild.id
  })
  if (!tournament) return
  return Gamer.helpers.tournaments.advertiseEvent(tournament)
})
