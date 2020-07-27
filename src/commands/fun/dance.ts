import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

export default new Command(`dance`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  return Gamer.helpers.tenor.randomGif(message, `dance`, constants.gifs.dance)
})
