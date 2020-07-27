import GamerClient from '../structures/GamerClient'

export default class {
  Gamer: GamerClient
  constructor(client: GamerClient) {
    this.Gamer = client
  }
  // Can be used to make the bot sleep
  sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  chooseRandom<T>(array: T[]) {
    return array[Math.floor(Math.random() * array.length)]!
  }
}
