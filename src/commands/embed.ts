import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command(`embed`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!args.length) return helpCommand.process(message, [`embed`], context)

  const settings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  // If the user does not have a modrole or admin role quit out
  if (
    !Gamer.helpers.discord.isModerator(message, settings?.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, settings?.staff.adminRoleID)
  )
    return

  const emojis = await Gamer.database.models.emoji.find()

  const [firstWord] = args
  const [user] = message.mentions
  if (user && firstWord.startsWith('<@')) args.shift()

  const transformed = Gamer.helpers.transform.variables(
    args.join(' '),
    user,
    message.member.guild,
    message.author,
    emojis
  )

  try {
    const embedCode = JSON.parse(transformed)
    if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
    if (typeof embedCode.thumbnail === 'string') embedCode.thumbnail = { url: embedCode.thumbnail }
    if (embedCode.color === 'RANDOM') embedCode.color = Math.floor(Math.random() * (0xffffff + 1))
    if (embedCode.timestamp) embedCode.timestamp = new Date().toISOString()
    await message.channel.createMessage({ content: embedCode.plaintext, embed: embedCode })
  } catch (error) {
    const embed = new MessageEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`embedding/embed:BAD_EMBED`))
      .setDescription(['```js', error, '```'].join('\n'))
    message.channel.createMessage({ embed: embed.code })
  }

  return
})
