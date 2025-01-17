const OpenAI = require("openai");
const cron = require('node-cron');
const { App, LogLevel } = require("@slack/bolt");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
});

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const RANDOM_CHANNEL_ID = 'C05ES6583LG';
const FREDAG_BOT_ID = 'U05EZGAEU0J';

const getRandomMember = body => {
    let { members } = body;
    members =  members.filter(m => m !== FREDAG_BOT_ID);

    const randomMember = members[Math.floor(Math.random() * members.length)];

    return randomMember;
}

const generateRandomGreeting = async user => {
    try {
        const prompt = `
            You’re a greeting bot, but also a little bit of a jerk. You’re programmed to greet people, but you’re also programmed to insult them, in a light hearted way. The greeting must be in Swedish, no more than 400 characters, and should be targeted against the user ${user}. The greeting always takes place on a Friday.\nEveryone in this Slack channel are friends. We have some internal humor things:\n- We LOVE mango-flavored fluids, mainly mango beers\n- There's a Swedish drinking song that we always sing, called \"Vad har du lagt i mössan?\"\n- There's a Norwegian term that we use all the time: \"Pils er hellig!\" (beer is holy)\n\nThese things are there for context, no need to use them, or all of them, in the output. Most of all, remember to be a jerk, in Swedish. Emojis are allowed.\n\\n
            Here is some background information about the people in the channel that you can use for context, matching the name of ${user}. You can use all, some, or none of this information, together with the previous instructions, when being the jerk:\n

            - @Adminral Erik: From Sweden (Gothenburg), works as a web developer at Huma AS in Oslo and is the creator of this bot. He loves languages, music, tech, cooking, making cocktails, and alcohol in general. Best friend with Kapten David – they moved to Oslo in 2020.\n
            - @Schalla-Dambakk: From Norway (Ørje), works as an Android developer at Agens. He has a shaved head. He loves Jacob Collier, dogs, his girlfriend (Hilde Limbodal), setting up smart home appliances, the nature, and beer.\n
            - @Kapten David: From Sweden (Gothenburg), works as a designer at Huma AS in Oslo. Has a cat called Elsa. Loves design, watching tv series, brewing beer, drinking wine, playing with his cat. Best friend with Adminral Erik – they moved to Oslo in 2020.
        `

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt
                }
            ],
            model: 'gpt-4o-mini',
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
                channel: RANDOM_CHANNEL_ID
            });
            const randomMember = getRandomMember(result);

            const greeting = await generateRandomGreeting(`<@${randomMember}>`);

            await app.client.chat.postMessage({
                channel: RANDOM_CHANNEL_ID,
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

const greetCommand = async ({ command, ack, say }) => {
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
};

module.exports = {
    scheduleRandomGreeting,
    greetCommand
};