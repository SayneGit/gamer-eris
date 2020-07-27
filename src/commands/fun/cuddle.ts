import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'
import fetch from 'node-fetch'
import { TenorGif } from '../../lib/types/tenor'
import constants from '../../constants'

export default new Command(`cuddle`, async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const user = message.mentions[0] || message.author

  const embed = new MessageEmbed()
    .setAuthor(message.member?.nick || message.author.username, message.author.avatarURL)
    .setDescription(
      language(user.id === message.author.id ? `fun/cuddle:SELF` : `fun/cuddle:REPLY`, {
        mention: user.mention,
        author: message.author.mention
      })
    )

  if (Gamer.guildsDisableTenor.has(message.guildID)) {
    embed
      .setImage(Gamer.helpers.utils.chooseRandom(constants.gifs.cuddle))
      .setFooter(language(`common:WHITELISTED_TENOR`))
  } else {
    const data: TenorGif | undefined = await fetch(`https://api.tenor.com/v1/search?q=cuddle&key=LIVDSRZULELA&limit=50`)
      .then(res => res.json())
      .catch(() => undefined)

    if (!data || !data.results?.length) return message.channel.createMessage(language(`fun/advice:ERROR`))
    const randomResult = Gamer.helpers.utils.chooseRandom(data.results)
    const [media] = randomResult.media

    if (media) embed.setImage(media.gif.url)
    embed.setFooter(language(`common:TENOR`))
  }

  message.channel.createMessage({ embed: embed.code })
  if (message.member) return Gamer.helpers.levels.completeMission(message.member, `cuddle`, message.guildID)
})
