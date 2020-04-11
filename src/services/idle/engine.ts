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

function reset() {
  // This function will totally reset your game. Incase users want to play again.
}

function calculateMillisecondsTillBuyable(currency: number, cost: number, perSecond: number) {
  return (cost - currency) / perSecond / 1000
}

export const idleGameEngine = {
  prestige,
  upgrade,
  process,
  viewAd,
  reset,
  calculateMillisecondsTillBuyable
}
