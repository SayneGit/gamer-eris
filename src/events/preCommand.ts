// Logs that a command run (even if it was inhibited)
import { Message } from 'eris'
import Event from '../lib/structures/Event'
import { Command, CommandContext } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default class extends Event {
  async execute(command: Command, message: Message, _args: string[], context: CommandContext) {
    if (!message.guildID || !message.member) return

    const Gamer = context.client as GamerClient

    const [name] = command.names

    // if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

    Gamer.helpers.logger.blue(`[${context.commandName}] Command ran in ${message.member.guild.name}`)

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
    const xpForCommand = [`profile`, `background`].includes(name) ? Math.floor(Math.random() * (10 - 2 + 1) + 2) : 1

    Gamer.helpers.levels.addLocalXP(message.member, xpForCommand)
    Gamer.helpers.levels.addGlobalXP(message.member, xpForCommand)
  }
}
