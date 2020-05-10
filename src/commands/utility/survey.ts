import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel } from 'eris'
import { MessageEmbed } from 'helperis'
import { FeedbackCollectorData } from '../../lib/types/gamer'

// * <create|remove|list|run:default> (name:surveyname)

export default new Command(`survey`, async (message, args, context) => {
  if (!message.guildID || !message.member || !(message.channel instanceof TextChannel)) return

  const Gamer = context.client as GamerClient

  const botMember = await Gamer.helpers.discord.fetchMember(message.member.guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  const [action, surveyName, ...input] = args

  const survey = await Gamer.database.models.survey.findOne({ guildID: message.guildID, name: surveyName })

  switch (action) {
    /*
        Remove a survey
    */
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
        List all available surveys
    */
    case 'list':
      const allSurveys = await Gamer.database.models.survey.find({ guildID: message.guildID })
      if (!allSurveys.length) return message.channel.createMessage(`utility/survey:NO_SURVEYS_FOUND`)

      const surveyList = allSurveys.map(s => s.name).join('\n')
      return Gamer.helpers.discord.embedResponse(
        message,
        surveyList.length > 2000 ? surveyList.substring(0, 1997) + '...' : surveyList
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
      const channel = message.channel.guild.channels.get(survey.channelID) as TextChannel
      if (!channel) return message.channel.createMessage(language(`utility/survey:CHANNEL_DELETED`))
      // Check all necessary permissions in the survey channel
      if (!channel.permissionsOf(Gamer.user.id).has('sendMessages'))
        return message.channel.createMessage(language(`utility/survey:MISSING_SEND`))
      if (!channel.permissionsOf(Gamer.user.id).has('embedLinks'))
        return message.channel.createMessage(language(`utility/survey:MISSING_EMBED`))
      if (!channel.permissionsOf(Gamer.user.id).has('addReactions'))
        return message.channel.createMessage(language(`utility/survey:MISSING_REACT`))
      if (!channel.permissionsOf(Gamer.user.id).has('readMessageHistory'))
        return message.channel.createMessage(language(`utility/survey:MISSING_HISTORY`))
      if (!channel.permissionsOf(Gamer.user.id).has('externalEmojis'))
        return message.channel.createMessage(language(`utility/survey:MISSING_EXTERNAL`))

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
          guildID: message.guildID,
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
            const data = collector.data as FeedbackCollectorData
            const questions = data.settings.feedback.bugs.questions

            if (!msg.content) return
            embed.addField(data.question, msg.content)

            if (data.question === questions[questions.length - 1]) {
              // This was the final question so now we need to post the feedback
              channel.createMessage({ embed: embed.code })
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
      channel.createMessage({ embed: embed.code })
      return Gamer.helpers.levels.completeMission(message.member, `survey`, message.guildID)
  }
})

const answerTypes = [
  { type: `string`, value: `Text.`, arrayPossible: true },
  { type: `number`, value: `Number`, arrayPossible: true },
  { type: `member`, value: `@member or member ID.`, arrayPossible: false },
  { type: `members`, value: `Multiple members.`, arrayDefault: true },
  { type: `user`, value: `User ID. A user does NOT have to be on the server`, arrayPossible: false },
  { type: `users`, value: `Multiple users`, arrayDefault: true },
  { type: `channel`, value: `#channel`, arrayPossible: false },
  { type: `channels`, value: `Multiple #channels`, arrayDefault: true },
  {
    type: `role`,
    value: `@role or role id. Warning: If the user @role it will actually ping the entire role.`,
    arrayPossible: false
  },
  { type: `roles`, value: `Multiple roles.`, arrayDefault: true },
  { type: `multiple choice`, value: `Multiple Choice`, arrayPossible: false }
]
