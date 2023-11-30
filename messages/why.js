const moment = require('moment-timezone');
const axios = require('axios');
const { Readable } = require('stream');

const checkFriday = d => d.day() === 5

const whyMessage = async ({ message, client, say }) => {
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

            await client.files.uploadV2({
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
};

module.exports = whyMessage;