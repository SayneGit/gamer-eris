// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { GuildSettings, MemberSettings } from '../lib/types/settings'
import { TextChannel } from 'eris'
import constants from '../constants'
import config from '../../config'
import fetch from 'node-fetch'

// 10 minutes
const maxInactiveTime = 600000
const DAILY = 1000 * 60 * 60 * 24
export default class extends Event {
  async execute() {
    // Clean out message collectors after 2 minutes of no response
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]

      const promises = [...Gamer.collectors.values()].map(async collector => {
        const guildSettings = allGuildSettings.find(g => g.id === collector.guildID)
        // How many minutes to wait for a response for the collectors in this guild. VIP Guilds can change the time
        const menutime = guildSettings ? guildSettings.menutime : 2
        // If the collector had no response in X minutes delete the collector
        if (Date.now() - collector.createdAt > 60000 * menutime) Gamer.collectors.delete(collector.authorID)
      })

      Promise.all(promises)
    }, 120000)

    // Clean up inactive verification channels
    setInterval(async () => {
      // Fetch this guilds settings
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]
      // We only loop over saved settings guilds because if they use defaults they they wont have verify enabled anyway
      const promises = allGuildSettings.map(async guildSettings => {
        // If this server does not enable the verification system skip or if they have no verification channels.
        if (!guildSettings.verify.enabled || !guildSettings.verify.channelIDs.length) return

        const guild = Gamer.guilds.get(guildSettings.id)
        if (!guild) return

        for (const channelID of guildSettings.verify.channelIDs) {
          const channel = guild.channels.get(channelID)
          if (!(channel instanceof TextChannel)) return

          // If missing channel perms exit out
          if (channel.permissionsOf(Gamer.user.id).has('manageChannels')) return

          const message =
            channel.messages.get(channel.lastMessageID) ||
            (await channel.getMessage(channel.lastMessageID).catch(() => null))
          // If no message something is very wrong as the first json message should always be there to be safe just cancel
          if (!message) return

          const guildSettings = (await Gamer.database.models.guild.findOne({
            id: guild.id
          })) as GuildSettings | null

          const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
          if (!language) return

          // If the channel has gone inactive too long delete it so there is no spam empty unused channels
          if (Date.now() - message.timestamp > maxInactiveTime)
            channel.delete(language(`basic/verify:CHANNEL_DELETE_REASON`))
        }
      })

      Promise.all(promises)
    }, maxInactiveTime)

    // Randomly select 3 new missions to use every day
    setInterval(() => {
      // Remove all missions first before creating any new missions
      Gamer.database.models.mission.deleteMany({})

      // Find 3 new random missions to use for today
      Gamer.missions = []
      for (let i = 0; i < 3; i++)
        Gamer.missions.push(constants.missions[Math.floor(Math.random() * (constants.missions.length - 1))])
    }, DAILY)

    // Checks if a member is inactive to begin losing XP every day
    setInterval(async () => {
      // Fetch all guilds from db as anything with default settings wont need to be checked
      const allGuildSettings = (await Gamer.database.models.guild.find()) as GuildSettings[]

      for (const guildSettings of allGuildSettings) {
        // If the inactive days allowed has not been enabled then skip
        if (!guildSettings.xp.inactiveDaysAllowed) continue

        const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
        if (!language) continue

        // Get all members from the database as anyone with default settings dont need to be checked
        const allMemberSettings = (await Gamer.database.models.member.find()) as MemberSettings[]

        for (const memberSettings of allMemberSettings) {
          // If they have never been updated skip. Or if their XP is below 100 the minimum threshold
          if (!memberSettings.leveling.lastUpdatedAt || memberSettings.leveling.xp < 100) continue
          // Get the member object
          const guild = Gamer.guilds.get(guildSettings.id)
          const member = guild?.members.get(memberSettings.memberID)
          if (!member) continue

          // Calculate how many days it has been since this user was last updated
          const daysSinceLastUpdated = (Date.now() - memberSettings.leveling.lastUpdatedAt) / 1000 / 60 / 60 / 24
          if (daysSinceLastUpdated < guildSettings.xp.inactiveDaysAllowed) continue

          // Remove 1% of XP from the user for being inactive today.
          await Gamer.helpers.levels.removeXP(
            member,
            language(`leveling/xp:ROLE_REMOVE_REASON`),
            Math.floor(memberSettings.leveling.xp * 0.01)
          )
        }
      }
    }, DAILY)

    // Create product analytics for the bot
    setInterval(() => {
      // Send a post request to amplitude url of the first 10 events from the amplitude cache. Rate limit is 10/s
      fetch(config.apiKeys.amplitude.url, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/camelcase
          api_key: config.apiKeys.amplitude.key,
          // Splice will return the deleted items from the array
          events: Gamer.amplitude.splice(0, 10)
        })
      })
    }, 1000)

    return Gamer.helpers.logger.green(`[READY] All shards completely ready now.`)
  }
}