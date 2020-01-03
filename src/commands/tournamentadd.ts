import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`tournamentadd`, `tadd`], async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient
  const guildID = message.channel.guild.id

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(guildID) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [number, teamName] = args
  const tournamentID = parseInt(number, 10)

  if (!tournamentID) return helpCommand.process(message, [`tournamentadd`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: guildID
  })

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings ? guildSettings.staff.modRoleIDs : []) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  )
    return

  // Get the tournament from this server using the id provided
  const tournament = await Gamer.database.models.tournament.findOne({
    id: tournamentID,
    guildID: guildID
  })
  if (!tournament) return message.channel.createMessage(language(`tournaments/tournaments:INVALID`))

  if (!message.mentions.length || message.mentions.length !== tournament.playersPerTeam)
    return message.channel.createMessage(
      language(`tournaments/tournamentjoin:NEED_PLAYERS`, { needed: tournament.playersPerTeam })
    )

  message.channel.createMessage(language(`tournaments/tournamentadd:PATIENCE`))

  const playerIDs = message.mentions.map(user => user.id)

  for (const userID of playerIDs) {
    const mention = `<@!${userID}>`
    // Check if any of the users are already in a team
    if (tournament.teams.find(team => team.userIDs.includes(userID)))
      return message.channel.createMessage(language(`tournaments/tournamentjoin:ALREADY_PLAYING`, { mention }))

    const member = message.channel.guild.members.get(userID)
    if (!member) return message.channel.createMessage(language(`tournaments/tournamentjoin:NOT_MEMBER`, { mention }))

    // Does the user have the roles necessary to join this tournament OR If no roles were set everyone is allowed
    const hasPermission = tournament.allowedRoleIDs.length
      ? member.roles.some(roleID => tournament.allowedRoleIDs.includes(roleID))
      : true

    if (!hasPermission) {
      const embed = new GamerEmbed().setAuthor(member.user.username, member.user.avatarURL).setDescription(
        language(`tournaments/tournamentjoin:MISSING_ALLOWED_ROLES`, {
          roles: tournament.allowedRoleIDs.map(id => `<@&${id}>`).join(', '),
          mention: member.mention
        })
      )
      return message.channel.createMessage({ embed: embed.code })
    }
  }

  tournament.teams.push({
    name: teamName,
    userIDs: playerIDs
  })
  tournament.save()

  return message.channel.createMessage(language(`tournaments/tournamentjoin:REGISTERED`))
})
