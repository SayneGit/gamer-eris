import { Command } from 'yuuko'
import { PrivateChannel, CategoryChannel, GroupChannel } from 'eris'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`label`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const content = args.join(' ')
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel)
    return Gamer.helpers.mail.handleDM(message, content)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!guildSettings || !Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const helpCommand = Gamer.commandForName(`help`)
  const [type, name, categoryID] = args
  if (!type) return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })

  const language = Gamer.getLanguage(message.guildID)

  switch (type.toLowerCase()) {
    case `list`:
      const labels = await Gamer.database.models.label.find({ guildID: message.guildID })
      return message.channel.createMessage(
        labels.length ? labels.map(label => label.name).join('\n') : language(`mails/label:NO_LABELS`)
      )
    case `delete`:
      if (!name) return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })
      const labelToDelete = await Gamer.database.models.label.find({
        name,
        guildID: message.guildID
      })
      if (!labelToDelete)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:INVALID_NAME`, { name }))

      Gamer.database.models.label.deleteOne({ name, guildID: message.guildID }).exec()
      return Gamer.helpers.discord.embedResponse(message, language(`mails/label:DELETED`, { name }))
    case `create`:
      if (!name || !categoryID) return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })
      const category = message.member.guild.channels.get(categoryID)
      if (!category || !(category instanceof CategoryChannel))
        return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })

      const labelExists = await Gamer.database.models.label.findOne({
        name,
        guildID: message.guildID
      })

      if (labelExists)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:LABEL_EXISTS`, { name }))

      await Gamer.database.models.label.create({
        authorID: message.author.id,
        categoryID: category.id,
        guildID: message.member.guild.id,
        name
      })

      return Gamer.helpers.discord.embedResponse(message, language(`mails/label:CREATED`, { name }))
    case `set`:
      if (!name) return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })
      const labelToSet = await Gamer.database.models.label.findOne({
        name,
        guildID: message.guildID
      })
      if (!labelToSet)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:INVALID_NAME`, { name }))

      const mail = await Gamer.database.models.mail.findOne({
        channelID: message.channel.id
      })

      if (!mail) return message.channel.createMessage(language(`mails/label:NOT_MAIL_CHANNEL`))

      const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
      if (!botMember || !botMember.permission.has('manageChannels'))
        return message.channel.createMessage(language(`mails/label:NEED_MANAGE_CHANNELS`))

      return message.channel.edit({ parentID: labelToSet.categoryID })
  }

  return helpCommand?.execute(message, [`label`], { ...context, commandName: 'help' })
})
