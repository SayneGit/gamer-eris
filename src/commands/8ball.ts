import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command([`8ball`, `8b`, `fortune`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || 'en-US')
  if (!language) return
  if (!args.length) return message.channel.createMessage(language(`fun/8ball:NO_ARGS`))

  message.channel.createMessage(language(`fun/8ball:REPLY_NUMBER${Math.floor(Math.random() * 12)}`))
  return Gamer.helpers.levels.completeMission(message.member, `8ball`, message.channel.guild.id)
})