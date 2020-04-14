import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { idleGameEngine } from '../../services/idle/engine'

function getUpgrade(type: 'friends' | 'servers', level: number) {
  const upgrade =
    type === 'servers' ? constants.idle.servers.upgrades.get(level) : constants.idle.friends.upgrades.get(level)
  return upgrade
}

export default new Command([`idrupgrade`, `idru`], async (message, args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')

  // TODO: Not sure how to handle profiles yet
  const profile = await Gamer.database.models.idlediscordrevolution.findOne({ userID: message.author.id })
  if (!profile)
    return message.channel.createMessage(language(`gaming/idrupgrade:EXISTS`, { emoji: constants.emojis.boosts }))

  const allowedItems = ['friends', 'servers']

  const [type, number] = args
  // Default to friends
  const category = type?.toLowerCase() || 'friends'
  if (!allowedItems.includes(category)) return helpCommand?.process(message, [`idrupgrade`], context)

  const amount = Number(number) || 1
  let finalLevel = 0
  let totalCost = 0

  for (let i = 1; i <= amount; i++) {
    // Check the cost of this item
    let cost = 0
    let level = 0
    let baseProfit = 0
    let response = ''

    switch (category) {
      case 'friends':
        cost = idleGameEngine.calculateUpgradeCost(constants.idle.friends.baseCost, i)
        level = profile.friends || 0
        baseProfit = constants.idle.friends.baseProfit
        profile.friends = (profile.friends || 0) + 1
        response = getUpgrade('friends', profile.friends)?.response || ''
        break
      case 'servers':
        cost = idleGameEngine.calculateUpgradeCost(constants.idle.servers.baseCost, i)
        level = profile.servers || 0
        baseProfit = constants.idle.servers.baseProfit
        profile.servers = (profile.servers || 0) + 1
        response = getUpgrade('servers', profile.servers)?.response || ''
        break
      default:
        // SOMETHING WENT TERRIBLY WRONG
        return Gamer.helpers.logger.yellow('[ERROR] Invalid category provided to IDRUPGRADE command.')
    }

    // Check if the user can't afford this.
    if (cost > profile.currency) {
      const timeUntilCanAfford = idleGameEngine.calculateMillisecondsTillBuyable(
        profile.currency,
        cost,
        idleGameEngine.calculateProfit(level, baseProfit, profile.prestigeMultiplier)
      )
      console.log(timeUntilCanAfford)
      message.channel.createMessage(
        language(`gaming/idrupgrade:NEED_BOOSTS`, {
          cost: cost.toFixed(2),
          current: profile.currency.toFixed(2),
          emoji: constants.emojis.boosts,
          time: Gamer.helpers.transform.humanizeMilliseconds(timeUntilCanAfford)
        })
      )

      // User can't afford anymore so break the loop
      break
    }

    finalLevel = profile.friends || 0
    totalCost += cost
    // The user can afford this so we need to make the purchase for the user
    profile.currency -= cost
    // If this level has a story message response, we should send it now
    if (response) message.channel.createMessage(language(response, { mention: message.author.mention }))
  }

  // If there was no level changes we quitely error out. The response will have been sent above
  if (!finalLevel) return
  console.log(profile)
  // Now that all upgrades have completed, we can save the profile
  profile.save()

  return message.channel.createMessage(
    language(`gaming/idrupgrade:UPGRADED`, {
      name: category,
      level: finalLevel,
      emoji: constants.emojis.boosts,
      left: Math.ceil(profile.currency),
      cost: Math.ceil(totalCost)
    })
  )
})
