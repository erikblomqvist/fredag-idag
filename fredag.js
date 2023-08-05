require('dotenv').config()
const { App, LogLevel } = require("@slack/bolt")
const express = require('express')
const moment = require('moment-timezone')
const axios = require('axios')

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

    if (isFriday(d)) {
        response = "Ja, mina bekanta. :fredag_mina_bekanta:"
    } else {
        response = "Nej. :fredag-idag:"
    }

    await say(response)
})

app.message(/Varför?/i, async ({ message, client, say }) => {
    const d = moment().tz('Europe/Oslo')

    // const isFriday = checkFriday(d)
    const isFriday = true

    if (isFriday) {
        try {
            const haeljaFile = 'https://drive.google.com/uc?export=download&id=16OS9W6yTxS1fZz-BVLmx4lqt7EY9wVf1'
            const fileResponse = await axios.get(haeljaFile, { responseType: 'arraybuffer' })

            await client.files.upload({
                channels: message.channel,
                file: {
                    value: fileResponse.data,
                    options: {
                        filename: 'Nå ære Hælja.m4a',
                        contentType: 'audio/m4a'
                    }
                }
            })
        } catch (error) {
            console.error('Error uploading file: ', error)
        }
    } else {
        await say(':sob: :sob: :banana:')
    }
})

// app.message(/Varför?/i, async ({ say }) => {
//   const d = moment().tz('Europe/Oslo')
//   const isFriday = (d.day() === 5)
//     ? "Så är det bara. :fredag_mina_bekanta:"
//     : ":sob: :sob: :banana:"
//   await say(isFriday)
// })

(async () => {
    const server = express()

    server.all('/slack/events', (req, res) => {
        res.status(200).send('Ok')
    })

    await app.start(process.env.PORT || 3000)
    console.log('Fredag is running!')
})()
