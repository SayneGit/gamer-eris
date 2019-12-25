import { TextChannel } from 'eris'
// import { GuildSettings } from '../types/settings'
import GamerClient from '../structures/GamerClient'
import { GamerTournament } from '../../database/schemas/tournament'
// import { GamerEvent } from '../types/gamer'
// import fetch from 'node-fetch'
import { Canvas } from 'canvas-constructor'
// import constants from '../../constants'
import GamerEmbed from '../structures/GamerEmbed'
import config from '../../../config'
// import { TFunction } from 'i18next'

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  async advertise(tournament: GamerTournament, channelID?: string) {
    const buffer = await this.makeCanvas(tournament)

    const imageChannel = this.Gamer.getChannel(config.channelIDs.imageStorage)
    if (!imageChannel || !(imageChannel instanceof TextChannel)) return
    const result = await imageChannel.createMessage('', { file: buffer, name: `gamer-tourney-bracket` })

    const embed = new GamerEmbed()
      .setTitle(`Tournament Description:`)
      .setDescription(tournament.description)
      .setImage(result.attachments[0].proxy_url)
      .setTimestamp(tournament.start)

    const adChannel = channelID
      ? this.Gamer.getChannel(channelID)
      : tournament.adChannelID
      ? this.Gamer.getChannel(tournament.adChannelID)
      : undefined

    if (!adChannel || !(adChannel instanceof TextChannel)) return

    if (
      !this.Gamer.helpers.discord.checkPermissions(adChannel, this.Gamer.user.id, [
        `readMessages`,
        `sendMessages`,
        `embedLinks`,
        `attachFiles`,
        `readMessageHistory`,
        `addReactions`,
        `externalEmojis`
      ])
    )
      return

    const adCardMessage = tournament.adMessageID
      ? adChannel.messages.get(tournament.adMessageID) ||
        (await adChannel.getMessage(tournament.adMessageID).catch(() => undefined))
      : undefined

    if (adCardMessage) adCardMessage.edit({ embed: embed.code })
    else {
      const card = await adChannel.createMessage({ embed: embed.code })
      tournament.adChannelID = adChannel.id
      tournament.adMessageID = card.id
      tournament.save()
    }
  }

  async makeCanvas(tourney: GamerTournament) {
    // const customBackgroundBuffer = tourney.backgroundURL
    //   ? await fetch(tourney.backgroundURL)
    //       .then(res => res.buffer())
    //       .catch(() => undefined)
    //   : undefined

    const teamNames = ['LOUD', 'Team SoloMid', 'Cloud9', 'EchoFox', 'Team Liquid', 'FaZe Clan', 'Fnatic', 'G2 Esports']

    const canvas = new Canvas(652, 367)
      .addImage(this.Gamer.buffers.tournaments, 8, 0)

      // if (customBackgroundBuffer) {
      //   canvas
      //     .setGlobalAlpha(0.85)
      //     .save()
      //     .createBeveledClip(0, 0, 652, 367, 5)
      //     // add the image and the gradient
      //     .addImage(customBackgroundBuffer, 6, -32, 680, 367, { radius: 5 })
      //     .printLinearGradient(0, 150, 0, 0, [
      //       { position: 0, color: `rgba(0, 0, 0, 0.85)` },
      //       { position: 0.95, color: `rgba(0, 0, 0, 0)` }
      //     ])
      //     .addRect(6, -32, 680, 367)
      //     .restore()
      // }

      // event title
      .setTextAlign(`left`)
      .setColor(`#7AAEFF`)
      .setTextFont(`26px SFTHeavy`)
      .addMultilineText(tourney.name, 30, 345)
      .setTextAlign(`left`)
      .setColor(`#FFFFFF`)
      // Always set font before responsiev text as the font size can be changed
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[0], 85, 35, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[1], 85, 67, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[2], 85, 106, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[3], 85, 138, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[4], 85, 178, 85)
      .setTextFont(`12px SFTRegular`)
      .addResponsiveText(teamNames[5], 85, 208, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[6], 85, 250, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[7], 85, 282, 85)
      .setTextFont(`12px LatoBold`)

      .addResponsiveText(teamNames[0], 253, 50, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[2], 253, 122, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[4], 253, 193, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[6], 253, 265, 85)
      .setTextFont(`12px LatoBold`)

      .addResponsiveText(teamNames[0], 425, 86, 85)
      .setTextFont(`12px LatoBold`)
      .addResponsiveText(teamNames[4], 425, 230, 85)
      .setTextFont(`12px SFTHeavy`)

      .addResponsiveText(teamNames[0], 502, 158, 85)

      .setColor('#7AAEFF')
      .setTextFont(`12px LatoBold`)
      .addText('2', 50, 35)
      .addText('1', 50, 67)
      .addText('2', 50, 106)
      .addText('1', 50, 138)
      .addText('2', 50, 178)
      .addText('0', 50, 208)
      .addText('2', 50, 250)
      .addText('1', 50, 282)

      .addText('2', 220, 50)
      .addText('1', 220, 122)
      .addText('2', 220, 193)
      .addText('0', 220, 265)

      .addText('2', 390, 86)
      .addText('0', 390, 230)

      .setTextFont(`12px SFTHeavy`)
      .addText('WINNER', 443, 158)

    return canvas.toBufferAsync()
  }
}
