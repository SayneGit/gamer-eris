import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventadvertise`, `ead`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName(`help`)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [number] = args
  const eventID = number ? parseInt(number, 10) : undefined

  if (!eventID) return helpCommand?.execute(message, [`eventadvertise`], { ...context, commandName: 'help' })
  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  const language = Gamer.getLanguage(message.guildID)
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  // If an old event card exists in a different channel get rid of it
  if (event.adChannelID && event.adMessageID && event.adChannelID !== message.channel.id) {
    Gamer.deleteMessage(event.adChannelID, event.adMessageID, `Event card moved to different channel.`).catch(
      () => undefined
    )
  }

  const channelID = message.channelMentions?.length ? message.channelMentions[0] : message.channel.id
  return Gamer.helpers.events.advertiseEvent(event, channelID)
})
