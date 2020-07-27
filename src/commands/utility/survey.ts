import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'
import { MessageEmbed } from 'helperis'
import { SurveyCollectorData } from '../../lib/types/gamer'
import constants from '../../constants'

// * <create|remove|list|run:default> (name:surveyname)

export default new Command(`survey`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient

  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  const [action, surveyName, ...input] = args

  const survey = await Gamer.database.models.survey.findOne({
    guildID: message.guildID,
    name: surveyName.toLowerCase()
  })

  switch (action) {
    // Remove a survey
    case 'remove':
      if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return
      if (!survey) return message.channel.createMessage(language(`utility/survey:NOT_FOUND`))

      const deleted = await survey.remove().catch(() => null)
      return message.channel.createMessage(
        deleted
          ? language(`utility/survey:DELETE_SUCCESS`, { SURVEY_NAME: surveyName })
          : language(`utility/survey:DELETE_FAILED`, { SURVEY_NAME: surveyName })
      )

    /*
        Create a new survey
    */
    case 'create':
      if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return
      if (survey) return message.channel.createMessage(language(`utility/survey:ALREADY_EXISTS`))
      return

    /*
        Run a survey - This is the default
    */
    default:
      if (!survey) return message.channel.createMessage(language(`utility/survey:NOT_FOUND`))
      const channel = message.member.guild.channels.get(survey.channelID) as TextChannel
      if (!channel) return message.channel.createMessage(language(`utility/survey:CHANNEL_DELETED`))
      if (
        !Gamer.helpers.discord.checkPermissions(channel, Gamer.user.id, [
          'sendMessages',
          'embedLinks',
          'externalEmojis',
          'addReactions'
        ])
      )
        return message.channel.createMessage(language(`utility/survey:MISSING_PERMS`))

      const embed = new MessageEmbed() // TODO ADD TITLE AND SUCH
      const splitContent = input.join(' ').split(` | `)

      for (const [index, question] of survey.questions.entries()) {
        if (splitContent.length && splitContent[index]) {
          embed.addField(question, splitContent[index])
          continue
        }

        await message.channel.createMessage(`${message.author.mention}, ${question}`)
        // Need to get responses from the users
        // Cancel the command and await for the collector
        return Gamer.collectors.set(message.author.id, {
          authorID: message.author.id,
          channelID: message.channel.id,
          createdAt: Date.now(),
          guildID: message.member.guild.id,
          data: {
            language,
            survey,
            embed,
            question
          },
          callback: async (msg, collector) => {
            if (!msg.member || !msg.guildID) return
            const CANCEL_OPTIONS = language(`common:CANCEL_OPTIONS`, { returnObjects: true })
            if (CANCEL_OPTIONS.includes(msg.content)) {
              message.channel.createMessage(language(`utility/survey:CANCELLED`, { mention: msg.author.mention }))
              return
            }

            // The user must have provided some sort of content
            const data = collector.data as SurveyCollectorData
            const questions = data.survey.questions

            if (!msg.content) return
            embed.addField(data.question, msg.content)

            if (data.question === questions[questions.length - 1]) {
              // This was the final question so now we need to post the feedback
              const m = await channel.createMessage({ embed: embed.code })
              await m.addReaction(constants.emojis.greenTick).catch(() => null)
              m.addReaction(constants.emojis.redX).catch(() => null)
              return Gamer.helpers.levels.completeMission(msg.member, `survey`, msg.guildID)
            }

            // If more questions create another collector
            const currentIndex = questions.findIndex(q => data.question === q)
            // Something is very wrong quit out
            if (currentIndex < 0) return

            const nextQuestion = questions[currentIndex + 1]
            // Send the message asking the user next question
            message.channel.createMessage(`${message.author.mention}, ${nextQuestion}`)
            // Update the collectors data
            collector.createdAt = Date.now()
            if (collector.data) data.question = nextQuestion
            Gamer.collectors.set(message.author.id, collector)
          }
        })
      }
      const m = await channel.createMessage({ embed: embed.code })
      await m.addReaction(constants.emojis.greenTick).catch(() => null)
      m.addReaction(constants.emojis.redX).catch(() => null)
      return Gamer.helpers.levels.completeMission(message.member, `survey`, message.guildID)
  }
})
