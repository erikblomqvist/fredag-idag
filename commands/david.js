const axios = require('axios');
const { Readable } = require('stream');
const { App, LogLevel } = require("@slack/bolt");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
});

const davidCommand = async ({ command, ack, say }) => {
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
};

module.exports = davidCommand;