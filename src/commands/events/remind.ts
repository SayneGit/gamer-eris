import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(
  [`remind`, `remindme`, `remindcreate`, `rc`, `remindcreate`, `remindercreate`],
  async (message, args, context) => {
    if (!message.guildID || !message.member) return

    const Gamer = context.client as GamerClient

    const helpCommand = Gamer.commandForName('help')
    if (!args.length) return helpCommand?.execute(message, ['remind'], { ...context, commandName: 'help' })

    const language = Gamer.getLanguage(message.guildID)

    const [time] = args
    if (time?.toLowerCase() === 'list') {
      const reminders = await Gamer.database.models.reminder.find({ userID: message.author.id })
      return Gamer.helpers.discord.embedResponse(
        message,
        reminders
          .map(
            reminder =>
              `**${reminder.reminderID}: ${Gamer.helpers.transform.humanizeMilliseconds(
                reminder.timestamp - Date.now()
              )}** => ${reminder.content}`
          )
          .join('\n')
      )
    }

    const startNow = time ? Gamer.helpers.transform.stringToMilliseconds(time) : undefined
    if (!startNow) return helpCommand?.execute(message, ['remind'], { ...context, commandName: 'help' })

    // Removes the time from the args leaving only the description
    args.shift()
    if (!args.length) return helpCommand?.execute(message, ['remind'], { ...context, commandName: 'help' })

    const [repeat] = args
    let recurring = false
    const interval = repeat ? Gamer.helpers.transform.stringToMilliseconds(repeat) : undefined
    if (interval) {
      recurring = true
      args.shift()
      if (!args.length) return helpCommand?.execute(message, ['remind'], { ...context, commandName: 'help' })
    }

    message.channel.createMessage(language('events/remind:CREATED', { mention: message.author.mention }))

    return Gamer.database.models.reminder.create({
      reminderID: message.id,
      guildID: message.guildID,
      channelID: message.channel.id,
      userID: message.author.id,
      recurring,
      content: args.join(' '),
      timestamp: Date.now() + startNow,
      interval
    })
  }
)
