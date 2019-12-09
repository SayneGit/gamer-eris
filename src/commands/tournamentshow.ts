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

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

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
      language(`events/tournamentshow:GAMING_EMOJI`),
      language(`events/tournamentshow:GAMING`, {
        platform: tournament.platform,
        game: tournament.game,
        activity: tournament.activity
      })
    )
    .addField(
      language(`events/tournamentshow:BASIC_EMOJI`),
      language(`events/tournamentshow:BASIC`, {
        allowedRoles: tournament.allowedRoleIDs.length
          ? tournament.allowedRoleIDs.map(id => `<@&${id}>`).join(' ')
          : NONE,
        alertRoles: tournament.alertRoleIDs.length ? tournament.alertRoleIDs.map(id => `<@&${id}>`).join(' ') : NONE
      })
    )
    .setFooter(language(`events/tournamentshow:STARTS_AT`))
    .setTimestamp(tournament.start)

  return message.channel.createMessage({ embed: embed.code })
})
