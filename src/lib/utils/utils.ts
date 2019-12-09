import GamerClient from '../structures/GamerClient'
import { GamerEvent } from '../types/gamer'
import { GamerTournament } from '../../database/schemas/tournament'

export default class {
  Gamer: GamerClient
  constructor(client: GamerClient) {
    this.Gamer = client
  }
  // Can be used to make the bot sleep
  async sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  createNewID(array: GamerEvent[] | GamerTournament[]) {
    if (array.length < 1) return 1

    let id = 1

    for (const item of array) if (item.id >= id) id = item.id + 1

    return id
  }
}
