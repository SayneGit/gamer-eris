import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventjoin`, `ej`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const [number] = args
  const eventID = number ? parseInt(number, 10) : undefined
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!eventID) return helpCommand.execute(message, [`eventjoin`], { ...context, commandName: 'help' })
  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (event.attendees.includes(message.author.id))
    return message.channel.createMessage(language(`events/eventjoin:ALREADY_JOINED`))

  // Does the user have the roles necessary to join this event OR If no roles were set everyone is allowed
  const hasPermission = event.allowedRoleIDs.length
    ? message.member.roles.some(roleID => event.allowedRoleIDs.includes(roleID))
    : true

  if (!hasPermission)
    return Gamer.helpers.discord.embedResponse(
      message,
      language(`events/eventjoin:MISSING_ALLOWED_ROLES`, {
        roles: event.allowedRoleIDs.map(id => `<@&${id}>`).join(', ')
      })
    )

  const response = Gamer.helpers.events.joinEvent(event, message.author.id, language)
  event.save()
  return message.channel.createMessage(response)
})
