import fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import database from '../../database/mongodb'
import { TwitchStream } from './api'
import { twitchAlert } from '../../lib/utils/twitch'

type TwitchRouter = fastify.Plugin<Server, IncomingMessage, ServerResponse, {}>

const twitchRouter: TwitchRouter = (fastify, _opts, done) => {
  // Verifying webhook
  fastify.get('/streams', async (req, res) => {
    const leaseSeconds = req.query['hub.lease_seconds']
    const challenge = req.query['hub.challenge']
    const topic = req.query['hub.topic']
    const mode = req.query['hub.mode']

    if (mode === 'unsubscribe') {
      res.send(challenge)
      return
    }

    const expiration = new Date()
    expiration.setSeconds(new Date().getSeconds() + Number(leaseSeconds))

    const stream = await database.models.subscription.findOneAndUpdate(
      {
        'meta.subscriptionTopic': topic
      },
      {
        'meta.subscriptionExpiresAt': expiration,
        'meta.retries': 0
      }
    )

    if (!stream) {
      res.status(200).send()
      return
    }

    res.send(challenge)
  })

  // Receiving webhook
  fastify.post('/streams', async (req, res) => {
    const userID = req.query.userID
    const body: {
      data: Array<TwitchStream>
    } = req.body

    const stream = body.data[0] || null

    const subscription = await database.models.subscription.findOne({
      'meta.userID': userID
    })

    if (!subscription) {
      // @todo: Need to clean up this subscription...
      console.warn('[Twitch] Received a unknown subscription for userID ', userID)
      res.status(200).send()
      return
    }

    if (stream && subscription.meta.lastOnlineAt === new Date(stream.started_at)) {
      // If the sreamer is online and we already have this started time in our database,
      // it means we already sent an online message...
      // We are probably receiving this for other changes such as stream title change
      res.status(200).send()
      return
    }

    if (stream?.started_at) {
      subscription.meta.lastOnlineAt = new Date(stream.started_at)
      await subscription.save()
    }

    console.debug(subscription.username, ' is ', stream ? 'online' : 'offline')
    twitchAlert(subscription, stream)

    res.status(200).send({ status: 'ok' })
  })

  done()
}

export default twitchRouter
