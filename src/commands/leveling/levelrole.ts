import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`levelrole`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [type, number, ...roleIDsOrNames] = args
  if (!type) return helpCommand.execute(message, [`levelrole`], { ...context, commandName: 'help' })

  if (type.toLowerCase() === `list`) {
    const levelroles = await Gamer.database.models.level.find({ guildID: message.guildID })

    const guildRoles = message.member.guild.roles

    let response = ``
    for (const level of levelroles) {
      if (response.length === 2000) break

      const roles = level.roleIDs.map(id => {
        const role = guildRoles.get(id)
        if (!role) return id
        return role.name
      })

      const text = `**#${level.level}:** ${roles.join(' ')}\n`
      if (response.length + text.length > 2000) break
      response += text
    }

    if (!response.length) return message.channel.createMessage(language(`leveling/levelrole:NONE`))
    return Gamer.helpers.discord.embedResponse(message, response)
  }

  const levelID = number ? parseInt(number, 10) : undefined
  if (!levelID) return helpCommand.execute(message, [`levelrole`], { ...context, commandName: 'help' })

  const guild = message.member.guild

  const roleIDs = message.roleMentions
  for (const id of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(id) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === id.toLowerCase())
    if (role) roleIDs.push(role.id)
  }

  // If no roles were provided then send help command
  if (['create', 'add', 'remove'].includes(type.toLowerCase()) && !roleIDs.length)
    return helpCommand.execute(message, [`levelrole`], { ...context, commandName: 'help' })

  const levelRoleData = await Gamer.database.models.level.findOne({
    guildID: message.guildID,
    level: levelID
  })

  switch (type.toLowerCase()) {
    case `create`:
      if (levelRoleData) return message.channel.createMessage(language(`leveling/levelrole:EXISTS`))
      await Gamer.database.models.level.create({
        level: levelID,
        roleIDs,
        guildID: guild.id,
        authorID: message.author.id
      })
      return Gamer.helpers.discord.embedResponse(message, language(`leveling/levelrole:CREATED`, { level: levelID }))
    case `add`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = [...levelRoleData.roleIDs, ...roleIDs]
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_ADDED`))
    case `remove`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = levelRoleData.roleIDs.filter(id => !roleIDs.includes(id))
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_REMOVED`))
    case `delete`:
      if (!levelRoleData) return

      Gamer.database.models.level.deleteOne({ _id: levelRoleData._id }).exec()
      return message.channel.createMessage(language(`leveling/levelrole:DELETED`, { number: levelRoleData.level }))
  }

  return helpCommand.execute(message, [`levelrole`], { ...context, commandName: 'help' })
})
