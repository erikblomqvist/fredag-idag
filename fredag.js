require('dotenv').config()
const { App, LogLevel } = require("@slack/bolt")
const express = require('express')
const moment = require('moment-timezone')
const axios = require('axios')
const { Readable } = require('stream');

const fredagBotId = 'U05EZGAEU0J';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
})

const checkFriday = d => d.day() === 5

app.message('Är det fredag idag?', async ({ say }) => {
    const d = moment().tz('Europe/Oslo');

    const isFriday = checkFriday(d);
    let response;

    if (isFriday) {
        response = "Ja, mina bekanta. :fredag_mina_bekanta:";
    } else {
        response = "Nej. :fredag-idag:";
    }

    await say(response);
});

app.message('Röven!', async ({ say }) => {
    const d = moment().tz('Europe/Oslo');

    const isFriday = checkFriday(d);
    let response;

    if (isFriday) {
        response = "Lugna ner dig nu, det är ju fredag.' :fredag_mina_bekanta:";
    } else {
        response = "Lugna ner dig nu, kukunge. :shushing_face: :pelle_big_black_hat:";
    }

    await say(response);
});

app.message(/Varför\?/i, async ({ message, client, say }) => {
    try {
        const d = moment().tz('Europe/Oslo');
        const isFriday = checkFriday(d);

        if (isFriday) {
            const haeljaFile = 'https://github.com/erikblomqvist/fredag-idag/raw/main/haelj.m4a';
            const fileResponse = await axios.get(haeljaFile, { responseType: 'arraybuffer' });

            // Convert buffer to readable stream
            const fileStream = new Readable();
            fileStream.push(fileResponse.data);
            fileStream.push(null);

            await client.files.upload({
                channels: message.channel,
                file: fileStream,
                filename: 'Nå ære Hælja.m4a',
                filetype: 'audio/m4a',
                title: 'Nå ære Hælja'
            });
        } else {
            await say(':sob: :sob: :banana:');
        }
    } catch (error) {
        console.error('Error in Varför message handler: ', error);
        await say('Sorry, something went wrong.');
    }
});

app.event('reaction_added', async ({ event, client }) => {
    try {
        if(event.reaction === '69') {
            const oneDayAgo = moment().subtract(1, 'days').unix();
            const history = await client.conversations.history({
                channel: event.item.channel,
                oldest: oneDayAgo.toString()
            });

            const reactedMessage = history.messages.find(m => m.ts === event.item.ts);

            if(reactedMessage) {
                await client.reactions.add({
                    channel: event.item.channel,
                    timestamp: event.item.ts,
                    name: '69'
                });
            }
        }
    } catch (error) {
        console.error('Error in reaction_added event handler: ', error);
    }
});

// Random greeting
const generateRandomGreeting = async user => {
    try {
        const prompt = `You’re a greeting bot, but also a little bit of a jerk. You’re programmed to greet people, but you’re also programmed to insult them, in a light hearted way. The greeting should be in Norwegian to the user ${user}.`;

        const response = await axios.post(
            'https://api.openai.com/v1/engines/gpt-3.5-turbo/completions',
            {
                prompt,
                max_tokens: 64
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error in generateRandomGreeting: ', error);
        return 'Sorry, something went wrong.';
    }
};

app.message('botta', async ({ message, client, say }) => {
    try {
        // Fetch users of the channel
        const result = await client.conversations.members({
            channel: message.channel
        });
        let { members } = result;
        // Filter out fredag bot
        members = members.filter(m => m !== fredagBotId);

        const randomMember = members[Math.floor(Math.random() * members.length)];

        const greeting = await generateRandomGreeting(`<@${randomMember}>`);

        await say(greeting);
    } catch (error) {
        console.error('Error in botta message handler: ', error);
        await say('Sorry, something went wrong.');
    }
});

(async () => {
    const server = express()

    server.all('/slack/events', (req, res) => {
        res.status(200).send('Ok')
    })

    await app.start(process.env.PORT || 3000)
    console.log('Fredag is running!')
})()