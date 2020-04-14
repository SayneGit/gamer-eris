// This is the game engine for the Idle Games in the bot.

import { GamerIdleDiscordRevolution } from '../../database/schemas/idlediscordrevolution'
import constants from '../../constants'
import { milliseconds } from '../../lib/types/enums/time'

function prestige() {
  // This function will reset ur entire game to 0. However it will increase your multiplier so you can get back faster and faster. Prestige is usually necessary to reach certain parts of the game.
  console.log('Prestiged')
}

function upgrade(item: string) {
  // This function is used to upgrade something. It costs some currency and upgrades it
  console.log('upgrading', item)
}

function viewAd() {
  // This function will send you an ad for a server invite. (Maybe)
}

function reset(userID: string) {
  // This function will totally reset your game. Incase users want to play again.
  console.log('reset game', userID)
}

/** Takes the current user currency, the cost of the item, and how much currency the user is gaining per second and converts it to milliseconds until this item can be bought. */
function calculateMillisecondsTillBuyable(currency: number, cost: number, perSecond: number) {
  return (cost - currency) / perSecond / 1000
}

function calculateUpgradeCost(baseCost: number, level: number) {
  return baseCost * Math.pow(1.07, level)
}

function calculateProfit(level: number, baseProfit = 1, prestige = 1) {
  let multiplier = 1
  if (level >= 25) multiplier *= 2
  if (level >= 50) multiplier *= 3
  if (level >= 75) multiplier *= 4
  if (level >= 100) multiplier *= 5
  if (level >= 150) multiplier *= 4
  if (level >= 200) multiplier *= 5
  if (level >= 300) multiplier *= 6
  if (level >= 400) multiplier *= 8
  if (level >= 500) multiplier *= 10
  if (level >= 600) multiplier *= 20
  if (level >= 700) multiplier *= 30
  if (level >= 800) multiplier *= 50
  if (level >= 900) multiplier *= 200
  if (level >= 1000) multiplier *= 300
  if (level >= 1250) multiplier *= 1250
  if (level >= 1500) multiplier *= 3800
  if (level >= 2000) multiplier *= 150000

  return level * baseProfit * multiplier * prestige
}

function isEpicUpgrade(level: number) {
  return [1, 25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1250, 1500, 2000].includes(level)
}

function calculateTotalProfit(profile: GamerIdleDiscordRevolution) {
  let subtotal = 0

  if (profile.friends)
    subtotal += calculateProfit(profile.friends, constants.idle.friends.baseProfit, profile.prestigeMultiplier)
  if (profile.servers)
    subtotal += calculateProfit(profile.servers, constants.idle.servers.baseProfit, profile.prestigeMultiplier)

  return subtotal
}

/** This function will be processing the amount of currency users have everytime they use a command to view their currency i imagine */
async function process(profile: GamerIdleDiscordRevolution) {
  const now = Date.now()
  const secondsSinceLastUpdate = (now - profile.lastUpdatedAt) / milliseconds.SECOND
  profile.currency += calculateTotalProfit(profile) * secondsSinceLastUpdate
  profile.lastUpdatedAt = now
  await profile.save()
}

export const idleGameEngine = {
  prestige,
  upgrade,
  process,
  viewAd,
  reset,
  calculateMillisecondsTillBuyable,
  calculateProfit,
  calculateUpgradeCost,
  calculateTotalProfit,
  isEpicUpgrade
}
