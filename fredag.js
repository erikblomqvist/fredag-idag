require('dotenv').config()
const { App, LogLevel } = require("@slack/bolt")
const express = require('express')
const moment = require('moment-timezone')
const axios = require('axios')
const { Readable } = require('stream')

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
})

const checkFriday = d => d.day() === 5

app.message('Är det fredag idag?', async ({ say }) => {
    const d = moment().tz('Europe/Oslo')

    const isFriday = checkFriday(d)
    let response

    if (isFriday) {
        response = "Ja, mina bekanta. :fredag_mina_bekanta:"
    } else {
        response = "Nej. :fredag-idag:"
    }

    await say(response)
})

app.message('Röven!', async ({ say }) => {
    const d = moment().tz('Europe/Oslo')

    const isFriday = checkFriday(d)
    let response

    if (isFriday) {
        response = "Lugna ner dig nu, det är ju fredag.' :fredag_mina_bekanta:"
    } else {
        response = "Lugna ner dig nu, kukunge. :shushing_face: :pelle_big_black_hat:"
    }

    await say(response)
})

app.message(/Varför\?/i, async ({ message, client, say }) => {
    try {
        const d = moment().tz('Europe/Oslo')
        const isFriday = checkFriday(d)

        if (isFriday) {
            const haeljaFile = 'https://github.com/erikblomqvist/fredag-idag/raw/main/haelj.m4a'
            const fileResponse = await axios.get(haeljaFile, { responseType: 'arraybuffer' })

            // Convert buffer to readable stream
            const fileStream = new Readable()
            fileStream.push(fileResponse.data)
            fileStream.push(null)

            await client.files.upload({
                channels: message.channel,
                file: fileStream,
                filename: 'Nå ære Hælja.m4a',
                filetype: 'audio/m4a',
                title: 'Nå ære Hælja'
            })
        } else {
            await say(':sob: :sob: :banana:')
        }
    } catch (error) {
        console.error('Error in Varför message handler: ', error)
        await say('Sorry, something went wrong.')
    }
})

app.event('reaction_added', async ({ event, client }) => {
    try {
        if (event.reaction === '69') {
            const oneDayAgo = moment().subtract(1, 'days').unix()
            const history = await client.conversations.history({
                channel: event.item.channel,
                oldest: oneDayAgo.toString()
            })

            const reactedMessage = history.messages.find(m => m.ts === event.item.ts)

            if (reactedMessage) {
                await client.reactions.add({
                    channel: event.item.channel,
                    timestamp: event.item.ts,
                    name: '69'
                })
            }
        }
    } catch (error) {
        console.error('Error in reaction_added event handler: ', error)
    }
})


// Random greeting
async function fetchUsers(client) {
    try {
        const result = await client.users.list()

        return result.members.filter(member => !member.is_bot && !member.deleted)
    } catch (error) {
        console.error('Error fetching users:', error)
        return []
    }
}

async function sendRandomGreeting(client) {
    const users = await fetchUsers(client)

    if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const text = `Hello <@${randomUser.id}>! Hope you're having a great day!`

        // Uncomment the following line for production
        const channel = 'erik-testing'
        // const channel = 'random'

        await client.chat.postMessage({ channel, text })
    }
}

app.message('botta', async ({ message, client }) => {
    if (message.channel === 'erik-testing') {
        await sendRandomGreeting(client)
    }
})

(async () => {
    const server = express()

    server.all('/slack/events', (req, res) => {
        res.status(200).send('Ok')
    })

    await app.start(process.env.PORT || 3000)
    console.log('Fredag is running!')
})()