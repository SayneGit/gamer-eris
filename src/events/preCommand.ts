// // Logs that a command run (even if it was inhibited)
import { EventListener } from 'yuuko'
import { TextChannel, NewsChannel } from 'eris'
import { userTag } from 'helperis'
import Gamer from '..'

export default new EventListener('preCommand', (command, message, _args, context) => {
  const [name] = command.names

  const channelName =
    message.channel instanceof TextChannel || message.channel instanceof NewsChannel ? message.channel.name : 'UNKNWON'
  const tag = userTag(message.author)

  Gamer.helpers.logger.debug(
    `[${context.commandName}] Command Ran in ${message.member?.guild.name || 'DM'} by ${tag} ID: ${
      message.author.id
    } in channel ${channelName} ID: ${message.channel.id}`,
    'blue'
  )

  if (!Gamer.debugModeEnabled)
    Gamer.helpers.logger.blue(`[${context.commandName}] Command ran in ${message.member?.guild.name || 'DM'}`)

  if (!message.guildID || !message.member) return

  Gamer.amplitude.push({
    authorID: message.author.id,
    channelID: message.channel.id,
    guildID: message.guildID,
    messageID: message.id,
    timestamp: message.timestamp,
    commandName: name,
    type: 'COMMAND_RAN'
  })

  // Return a random number between 2 and 10 points for special commands
  const xpForCommand = [`profile`, `background`].includes(name!) ? Math.floor(Math.random() * (10 - 2 + 1) + 2) : 1

  Gamer.helpers.levels.addLocalXP(message.member, xpForCommand)
  Gamer.helpers.levels.addGlobalXP(message.member, xpForCommand)
})
