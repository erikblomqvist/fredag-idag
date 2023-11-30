require('dotenv').config()
const { App, LogLevel } = require("@slack/bolt")
const express = require('express')
const moment = require('moment-timezone')
const axios = require('axios')
const OpenAI = require("openai");
const cron = require('node-cron');
const { Readable } = require('stream');

const fredagBotId = 'U05EZGAEU0J';
const randomChannelId = 'C05ES6583LG';

const soundboardOptions = [
    {
        name: 'darlig-service',
        file: 'darlig-service.m4a',
        title: 'Dårlig service'
    },
    {
        name: 'fredag-min-venn',
        file: 'det-er-fredag-min-venn.wav',
        title: 'Det er fredag min venn'
    },
    {
        name: 'knekk',
        file: 'knekk.m4a',
        title: 'Knekk'
    },
    {
        name: 'supertirsdag',
        file: 'supertirsdag.m4a',
        title: 'Supertirsdag'
    },
    {
        name: 'tirsdag-skjer-ingenting',
        file: 'tirsdag-skjer-det-absolutt-ingenting.m4a',
        title: 'Tirsdag skjer det absolutt ingenting'
    },
    {
        name: 'whyyy',
        file: 'whyyy.mp3',
        title: 'Whyyy'
    }
];

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
})

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const checkFriday = d => d.day() === 5

const getRandomMember = body => {
    let { members } = body;
    members =  members.filter(m => m !== fredagBotId);

    const randomMember = members[Math.floor(Math.random() * members.length)];

    return randomMember;
}

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
        await say('Nej, nu blev det fel. :fredag-idag:');
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
        const prompt = `You’re a greeting bot, but also a little bit of a jerk. You’re programmed to greet people, but you’re also programmed to insult them, in a light hearted way. The greeting must be in Swedish, no more than 300 characters, and should be targeted against the user ${user}. The greeting always takes place on a Friday.\nEveryone in this Slack channel are friends. We have some internal humor things:\n- We LOVE mango-flavored fluids, mainly mango beers\n- There's a Swedish drinking song that we always sing, called \"Vad har du lagt i mössan?\"\n- There's a Norwegian term that we use all the time: \"Pils er hellig!\" (beer is holy)\n\nThese things are there for context, no need to use them, or all of them, in the output. Most of all, remember to be a jerk, in Swedish. Emojis are allowed.`

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt
                }
            ],
            model: 'gpt-4-1106-preview',
            max_tokens: 200
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error in generateRandomGreeting: ', error);
        return 'Nej, nu blev det fel. :fredag-idag:';
    }
};

const scheduleRandomGreeting = async () => {
    // Every Friday at 10:00
    cron.schedule('0 10 * * 5', async () => {
        try {
            const result = await app.client.conversations.members({
                channel: randomChannelId
            });
            const randomMember = getRandomMember(result);

            const greeting = await generateRandomGreeting(`<@${randomMember}>`);

            await app.client.chat.postMessage({
                channel: randomChannelId,
                text: greeting
            });
        } catch (error) {
            console.error('Error in scheduleRandomGreeting: ', error);
        }
    }, {
        scheduled: true,
        timezone: 'Europe/Oslo'
    });
};

scheduleRandomGreeting();

app.command('/greet', async ({ command, ack, say }) => {
    await ack();

    try {
        const channelId = command.channel_id;

        const result = await app.client.conversations.members({
            channel: channelId
        });

        const randomMember = getRandomMember(result);

        const greeting = await generateRandomGreeting(`<@${randomMember}>`);

        await say({ text: greeting });
    } catch (error) {
        console.error('Error in greet command handler: ', error);
        await say('Nej, nu blev det fel. :fredag-idag:');
    }
});

app.command('/dåvid', async ({ command, ack, say }) => {
    // Just post this picture: https://github.com/erikblomqvist/fredag-idag/raw/main/seybrew.jpg
    // in the #random channel
    await ack();

    try {
        const channelId = command.channel_id;

        const seybrewFile = 'https://github.com/erikblomqvist/fredag-idag/raw/main/seybrew.jpg';
        const fileResponse = await axios.get(seybrewFile, { responseType: 'arraybuffer' });

        // Convert buffer to readable stream
        const fileStream = new Readable();
        fileStream.push(fileResponse.data);
        fileStream.push(null);

        await app.client.files.upload({
            channels: channelId,
            file: fileStream,
            filename: 'Dåvid',
            filetype: 'jpg',
            title: 'Dåvid'
        });
    } catch (error) {
        console.error('Error in dåvid command handler: ', error);
        await say('Nej, nu blev det fel. :fredag-idag:');
    }
});

app.command('/soundboard', async ({ command, ack, respond, client }) => {
    await ack();

    try {
        const query = command.text.trim().toLowerCase();
        const sound = soundboardOptions.find(o => o.name === query);

        if(!query) {
            await respond(`Du kan velge mellom disse lydene: \`${soundboardOptions.map(o => o.name).join(', ')}\``);
            return;
        }

        if(sound) {
            const channelId = command.channel_id;
            
            await respond(`Laster inn ${sound.title} … :loading:`);
            
            await processSoundSelection(sound, channelId, client);
        } else {
            await respond(`Nei, den lyden finnes ikke. Du kan velge mellom disse lydene: \`${soundboardOptions.map(o => o.name).join(', ')}\``);
        }
    } catch (error) {
        console.error('Error in soundboard command handler: ', error);
    }
});

const processSoundSelection = async (sound, channelId, client) => {
    try {
        const baseUrl = 'https://github.com/erikblomqvist/fredag-idag/raw/main/soundboard/';
        
        const soundUrl = `${baseUrl}${sound.file}`;
        const fileType = sound.file.split('.')[1];
        
        const fileResponse = await axios.get(soundUrl, { responseType: 'arraybuffer' });

        // Convert buffer to readable stream
        const soundStream = new Readable();
        soundStream.push(fileResponse.data);
        soundStream.push(null);

        await client.files.upload({
            channels: channelId,
            file: soundStream,
            filename: sound.title,
            filetype: `audio/${fileType}`,
            title: sound.title
        });
    } catch (error) {
        console.error('Error in processSoundSelection: ', error);
    }
};

(async () => {
    const server = express()

    server.all('/slack/events', (req, res) => {
        res.status(200).send('Ok')
    })

    await app.start(process.env.PORT || 3000)
    console.log('⚡️ Fredag är igång och då … då känns det som fredag!')
})()