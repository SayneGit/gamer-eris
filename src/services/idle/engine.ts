// This is the game engine for the Idle Games in the bot.

function prestige() {
  // This function will reset ur entire game to 0. However it will increase your multiplier so you can get back faster and faster. Prestige is usually necessary to reach certain parts of the game.
  console.log('Prestiged')
}

function upgrade(item: string) {
  // This function is used to upgrade something. It costs some currency and upgrades it
  console.log('upgrading', item)
}

function process() {
  // This function will be processing the amount of currency users have everytime they use a command to view their currency i imagine
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

export const idleGameEngine = {
  prestige,
  upgrade,
  process,
  viewAd,
  reset,
  calculateMillisecondsTillBuyable,
  calculateProfit,
  calculateUpgradeCost
}
