import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`shortcutcreate`, `scc`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!args.length) return helpCommand?.execute(message, [`shortcutcreate`], { ...context, commandName: 'help' })

  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  let deleteTrigger = false
  const [trigger] = args
  if (trigger?.toLowerCase() === 'deletetrigger') {
    args.shift()
    deleteTrigger = true
  }

  const [name] = args
  if (!name) return helpCommand?.execute(message, [`shortcutcreate`], { ...context, commandName: 'help' })
  // Remove the shortcut name so first item is the command name
  args.shift()

  const shortcut = await Gamer.database.models.shortcut.findOne({
    guildID: message.guildID,
    name: name.toLowerCase()
  })
  if (shortcut) return message.channel.createMessage(language(`shortcutcreate:NAME_TAKEN`, { name }))

  // This split with | allows users to make multiple commands run back to back
  const splitOptions = args.join(' ').split('|')

  const actions = splitOptions.map(action => {
    // The first will always need to be a command name and the rest are the args
    const [commandName, ...scargs] = action.trim().split(` `)
    // toString converts like #channel or @role mentions into the string version so we can save in db
    return { command: commandName!, args: scargs }
  })

  const payload = {
    actions,
    authorID: message.author.id,
    deleteTrigger,
    guildID: message.guildID,
    name: name.toLowerCase()
  }

  await Gamer.database.models.shortcut.create(payload)

  return message.channel.createMessage(language(`shortcuts/shortcutcreate:CREATED`, { name }))
})
