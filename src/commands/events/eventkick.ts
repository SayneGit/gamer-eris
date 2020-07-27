import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventkick`, `ek`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [number, id] = args
  const eventID = number ? parseInt(number, 10) : undefined
  if (!eventID) return helpCommand.execute(message, [`eventkick`], { ...context, commandName: 'help' })

  const language = Gamer.getLanguage(message.guildID)
  const [user] = message.mentions
  const userID = user?.id || id
  if (!userID) return message.channel.createMessage(language(`events/eventkick:NEED_USER`))

  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  if (!event.attendees.includes(userID) && !event.waitingList.includes(userID))
    return message.channel.createMessage(language(`events/eventkick:NOT_JOINED`))

  Gamer.helpers.events.leaveEvent(event, userID)

  return message.channel.createMessage(language(`events/eventkick:KICKED`))
})
