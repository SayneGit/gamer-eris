export default {
  token: 'Bot_Token_Here',
  topgg: {
    auth: 'SECRET',
    port: 3000,
    token: 'TOP_GG_TOKEN'
  },
  botlists: {
    discordBotsGG: '',
    botsOnDiscord: ''
  },
  defaultPrefix: '!',
  mongoConnectionString: 'CONNECTION_STRING',
  hooks: {
    port: 8080
  },
  twitch: {
    webhookCallback: '',
    clientID: '',
    clientSecret: ''
  },
  staff: {
    mods: ['userID'],
    developers: ['userID']
  },
  apiKeys: {
    amplitude: {
      key: 'AMPLITUDE_API_KEY',
      url: 'https://api.amplitude.com/2/httpapi'
    },
    tenor: 'Tenor_API_KEY',
    imgur: {
      id: `IMGUR_ID`,
      secret: `IMGUR_SECRET`
    }
  },
  channelIDs: {
    imageStorage: 'CHANNEL_ID',
    errors: 'CHANNEL_ID'
  }
}
