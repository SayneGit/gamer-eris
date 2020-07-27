import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import { highestRole } from 'helperis'
import { addRoleToMember } from '../../lib/utils/eris'

export default new Command(`mute`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)

  // Check if the bot has the manage roles permissions
  if (!botMember?.permission.has('manageRoles'))
    return message.channel.createMessage(language(`moderation/mute:NEED_MANAGE_ROLES`))

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  // If there is default settings the mute role won't exist
  if (!guildSettings || !guildSettings.moderation.roleIDs.mute)
    return message.channel.createMessage(language(`moderation/mute:NEED_MUTE_ROLE`))

  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  // Check if the mute role exists
  const muteRole = message.member.guild.roles.get(guildSettings.moderation.roleIDs.mute)
  if (!muteRole) return message.channel.createMessage(language(`moderation/mute:NEED_MUTE_ROLE`))

  const [userID] = args
  if (!userID) return

  args.shift()

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, userID)
  if (!member) return

  const botsHighestRole = highestRole(botMember)
  // Checks if the bot is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(botMember, member) || botsHighestRole.position <= muteRole.position)
    return message.channel.createMessage(language(`moderation/mute:BOT_TOO_LOW`))
  // Checks if the mod is higher than the user
  if (!Gamer.helpers.discord.compareMemberPosition(message.member, member))
    return message.channel.createMessage(language(`moderation/mute:USER_TOO_LOW`))

  // If it was a valid duration then remove it from the rest of the text
  const [time] = args
  if (!time) return message.channel.createMessage(language(`moderation/mute:NEED_REASON`))

  const duration = Gamer.helpers.transform.stringToMilliseconds(time)
  if (duration) args.shift()

  const reason = args.join(` `)
  if (!reason) return message.channel.createMessage(language(`moderation/mute:NEED_REASON`))

  addRoleToMember(member, guildSettings.moderation.roleIDs.mute)
  guildSettings.moderation.users.mutedUserIDs.push(member.id)
  guildSettings.save()

  const embed = new MessageEmbed()
    .setDescription(
      language(`moderation/mute:TITLE`, { guildName: message.member.guild.name, username: member.user.username })
    )
    .setThumbnail(member.user.avatarURL)
    .setTimestamp()
    .addField(language(`common:REASON`), reason)

  // Send the user a message
  const dmChannel = await member.user.getDMChannel().catch(() => undefined)
  if (dmChannel) dmChannel.createMessage({ embed: embed.code }).catch(() => undefined)

  const modlogID = await Gamer.helpers.moderation.createModlog(
    message,
    guildSettings,
    language,
    member.user,
    `mute`,
    reason,
    duration
  )

  // Response that will get sent in the channel
  const response = new MessageEmbed()
    .setAuthor(language(`moderation/warn:MODERATOR`, { mod: message.author.username }), message.author.avatarURL)
    .addField(
      language(`moderation/modlog:MEMBER`),
      language(`moderation/warn:MEMBER_INFO`, { member: member.mention, user: member.username, id: member.id })
    )
    .addField(language(`common:REASON`), reason)
    .setTimestamp()
    .setFooter(language(`moderation/modlog:CASE`, { id: modlogID }))

  return message.channel.createMessage({ embed: response.code })
})
