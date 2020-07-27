import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command([`roleinfo`, `ri`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const roleIDOrName = args.join(' ')
  const [roleID] = message.roleMentions

  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : message.member.guild.roles.find(r => r.id === roleIDOrName || r.name.toLowerCase() === roleIDOrName.toLowerCase())
  if (!role) return

  const language = Gamer.getLanguage(message.guildID)

  const embed = new MessageEmbed()
    .setAuthor(role.name, message.author.avatarURL)
    .addField(language(`roles/roleinfo:ROLE_NAME`), role.mention, true)
    .addField(language(`roles/roleinfo:ROLE_ID`), role.id, true)
    .addField(language(`roles/roleinfo:ROLE_COLOR`), `#${role.color.toString(16).toUpperCase()}`, true)
    .addField(language(`roles/roleinfo:ROLE_SEPARATE`), Gamer.helpers.discord.booleanEmoji(role.hoist), true)
    .addField(language(`roles/roleinfo:ROLE_MENTIONABLE`), Gamer.helpers.discord.booleanEmoji(role.mentionable), true)
    .addField(language(`roles/roleinfo:ROLE_POSITION`), role.position.toString(), true)
    .setFooter(language(`roles/roleinfo:CREATED_AT`))
    .setTimestamp(role.createdAt)

  message.channel.createMessage({ embed: { ...embed.code, color: role.color } })
})
