import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command([`setprofanity`, `setwords`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const settings = await upsertGuild(message.guildID)

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  if (!type) return helpCommand.execute(message, [`setprofanity`], { ...context, commandName: 'help' })
  // Remove the type and the leftover should be all words
  args.shift()

  switch (type.toLowerCase()) {
    case `enable`:
      if (settings.moderation.filters.profanity.enabled)
        return message.channel.createMessage(language(`settings/setprofanity:ALREADY_ENABLED`))
      settings.moderation.filters.profanity.enabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setprofanity:ENABLED`))
    case `disable`:
      if (!settings.moderation.filters.profanity.enabled)
        return message.channel.createMessage(language(`settings/setprofanity:ALREADY_DISABLED`))
      settings.moderation.filters.profanity.enabled = false
      settings.save()
      return message.channel.createMessage(language(`settings/setprofanity:DISABLED`))
    case `add`:
      if (!args.length) return message.channel.createMessage(language(`settings/setprofanity:NO_WORDS`))

      const softwords = new Set([...args.map(arg => arg.toLowerCase()), ...settings.moderation.filters.profanity.words])
      settings.moderation.filters.profanity.words = [...softwords]
      settings.save()
      return message.channel.createMessage(language(`settings/setprofanity:ADDED`))
    case `remove`:
      if (!args.length) return message.channel.createMessage(language(`settings/setprofanity:NO_WORDS`))

      settings.moderation.filters.profanity.words = settings.moderation.filters.profanity.words.filter(
        word => !args.includes(word.toLowerCase())
      )
      settings.save()
      return message.channel.createMessage(language(`settings/setprofanity:REMOVED`))
    case `setup`:
      for (const word of constants.profanity.soft) {
        if (!settings.moderation.filters.profanity.words.includes(word))
          settings.moderation.filters.profanity.words.push(word)
      }
      for (const word of constants.profanity.strict) {
        if (!settings.moderation.filters.profanity.strictWords.includes(word))
          settings.moderation.filters.profanity.strictWords.push(word)
      }
      settings.moderation.filters.profanity.enabled = true
      settings.save()
      return message.channel.createMessage(language(`settings/setprofanity:SETUP`))
    case `strict`:
      const [subtype] = args
      if (!subtype) return

      args.shift()
      switch (subtype.toLowerCase()) {
        case `add`:
          const strictwords = new Set([...args, ...settings.moderation.filters.profanity.strictWords])
          settings.moderation.filters.profanity.strictWords = [...strictwords]
          settings.save()
          return message.channel.createMessage(language(`settings/setprofanity:ADDED`))
        case `remove`:
          settings.moderation.filters.profanity.strictWords = settings.moderation.filters.profanity.strictWords.filter(
            word => !args.includes(word.toLowerCase())
          )
          settings.save()
          return message.channel.createMessage(language(`settings/setprofanity:REMOVED`))
      }
  }

  return
})
