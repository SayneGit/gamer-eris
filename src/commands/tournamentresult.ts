import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel, TextChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'
import nodefetch from 'node-fetch'

export default new Command([`tournamentresult`, `tr`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [number, teamName] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID || !teamName) return helpCommand.process(message, [`tournamentresult`], context)

  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: message.channel.guild.id
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const channel = guildSettings?.channelIDs.tournamentResults
    ? message.channel.guild.channels.get(guildSettings.channelIDs.tournamentResults)
    : undefined
  if (!channel || !(channel instanceof TextChannel)) return

  const embed = new GamerEmbed()
    .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
    .setTitle(tournament.name)
    .setDescription(teamName)
    .setFooter(tournament.id.toString())
    .setTimestamp()

  if (message.attachments.length) {
    const buffer = await nodefetch(message.attachments[0].url)
      .then(res => res.buffer())
      .catch(() => undefined)
    if (buffer) {
      embed.attachFile(buffer, 'tourneyresult.png')
    }
  }

  channel.createMessage({ embed: embed.code }, embed.file)
})
