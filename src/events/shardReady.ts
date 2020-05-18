// This event is triggered once the bot is ready and online.
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MessageEmbed } from 'helperis'

export default class extends Event {
  async execute(id: number) {
    Gamer.helpers.logger.green(`[Shard READY] Shard ID ${id} is ready!`)
    const embed = new MessageEmbed()
      .setColor(`#2ecc71`)
      .setTitle(`Shard ${id} is ready`)
      .setTimestamp()
    Gamer.createMessage(`680852595061162014`, { embed: embed.code })
  }
}
