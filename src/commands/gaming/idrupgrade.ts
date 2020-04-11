import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { idleGameEngine } from '../../services/idle/engine'

export default new Command([`idrupgrade`, `idru`], async (message, _args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // TODO: Not sure how to handle profiles yet
  const exists = await Gamer.database.models.idlediscordrevolution.findOne({ userID: message.author.id })
  if (!exists)
    return message.channel.createMessage(language(`gaming/idrupgrade:EXISTS`, { emoji: constants.emojis.boosts }))

  // Find the recommend item that costs the least amount of boosts
  // TODO: What if it is maxed i dont want it resetting to 0.
  const friendUpgrade =
    constants.idle.friends.find(data => data.level === exists.friends || 0 + 1) || constants.idle.friends[0]
  const serverUpgrade =
    constants.idle.servers.find(data => data.level === exists.servers || 0 + 1) || constants.idle.servers[0]
  const inviteUpgrade =
    constants.idle.invites.find(data => data.level === exists.invites || 0 + 1) || constants.idle.invites[0]

  const nextUpgrades = [friendUpgrade, serverUpgrade, inviteUpgrade]
  let recommended = friendUpgrade

  for (const upgrade of nextUpgrades) {
    if (recommended.cost < upgrade.cost) continue
    recommended = upgrade
  }

  if (exists.currency < recommended.cost) {
    const currentLevels = [
      constants.idle.friends.find(data => data.level === exists.friends),
      constants.idle.servers.find(data => data.level === exists.servers),
      constants.idle.invites.find(data => data.level === exists.invites)
    ]

    const timeUntilCanAfford = idleGameEngine.calculateMillisecondsTillBuyable(
      exists.currency,
      recommended.cost,
      currentLevels.reduce((a, b) => a + (b?.currencyPerSecond || 0), 0)
    )

    return message.channel.createMessage(
      language(`gaming/idrupgrade:NEED_BOOSTS`, {
        cost: recommended.cost,
        current: exists.currency,
        time: timeUntilCanAfford
      })
    )
  }
  // Make the purchase
  exists.currency -= recommended.cost

  switch (recommended.type) {
    case 'friends':
      exists.friends = recommended.level
      break
    case 'servers':
      exists.servers = recommended.level
      break
    case 'invites':
      exists.invites = recommended.level
      break
  }

  exists.save()

  // If this upgrade has some response to send that is part of the story send it.
  if (recommended.response) message.channel.createMessage(language(recommended.response))

  return message.channel.createMessage(
    language(`gaming/idrupgrade:UPGRADED`, {
      // TODO: figure out how to do the name
      name: '',
      cost: recommended.cost,
      level: recommended.level,
      emoji: constants.emojis.boosts,
      left: exists.currency
    })
  )
})
