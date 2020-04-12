export default {
  friends: {
    baseCost: 5,
    baseProfit: 1,
    upgrades: new Map([
      [1, { title: 'gaming/idrupgrade:FRIENDS_1_TITLE', response: 'gaming/idrupgrade:FRIENDS_1_RESPONSE' }]
    ])
  },
  // TODO: REVIEW ALL THIS BELOW. THESE ARE JUST PLACEHOLDERS
  servers: {
    baseCost: 60,
    baseProfit: 60,
    upgrades: new Map([[1, { title: '', response: '' }]])
  }
}
