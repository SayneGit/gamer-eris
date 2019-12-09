import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`tournaments`, `t`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const tournaments = await Gamer.database.models.tournament.find({ guildID: message.channel.guild.id })
  if (!tournaments.length) return message.channel.createMessage(language('tournaments/tournaments:NONE'))

  const embed = new GamerEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setDescription(tournaments.map(t => `**${t.id}** ${t.name}`).join('\n'))

  return message.channel.createMessage({ embed: embed.code })
})
