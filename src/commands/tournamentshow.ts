import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`tournamentshow`, `ts`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [tourneyID] = args
  if (!tourneyID) return message.channel.createMessage(language(`tournaments/tournaments:NEED_ID`))

  // Get the event from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tourneyID,
    guildID: message.channel.guild.id
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  const NONE = language(`common:NONE`)

  const embed = new GamerEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setTitle(`[1] ${tournament.name}`)
    .setDescription(`**[2]** ${tournament.description}`)
    .addField(
      language(`events/eventshow:GAMING_EMOJI`),
      language(`tournaments/tournamentshow:GAMING`, {
        platform: tournament.platform,
        game: tournament.game,
        activity: tournament.activity
      })
    )
    .addField(
      language(`events/eventshow:BASIC_EMOJI`),
      language(`tournaments/tournamentshow:BASIC`, {
        allowedRoles: tournament.allowedRoleIDs.length
          ? tournament.allowedRoleIDs.map(id => `<@&${id}>`).join(' ')
          : NONE,
        alertRoles: tournament.alertRoleIDs.length ? tournament.alertRoleIDs.map(id => `<@&${id}>`).join(' ') : NONE,
        playersPerTeam: tournament.playersPerTeam,
        maxTeams: tournament.maxTeams
      })
    )
    .setFooter(language(`tournaments/tournamentshow:STARTS_AT`))
    .setTimestamp(tournament.start)
  if (tournament.teams.length)
    embed.addField(
      language(`events/eventshow:RSVP_EMOJI`),
      tournament.teams.map(team => `${team.name}: ${Gamer.helpers.discord.idsToUserTag(team.userIDs)}`).join('\n')
    )

  return message.channel.createMessage({ embed: embed.code })
})
