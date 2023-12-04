const axios = require('axios');
const { Readable } = require('stream');

const soundboardOptions = [
    {
        name: 'daarlig-service',
        file: 'daarlig-service.m4a',
        title: 'Dårlig service :face_with_rolling_eyes:'
    },
    {
        name: 'mandag',
        file: 'det-er-mandag.wav',
        title: 'Det er mandag! :sunny:'
    },
    {
        name: 'fredag-min-venn',
        file: 'det-er-fredag-min-venn.wav',
        title: ':sparkles: Det er fredag min venn :sparkles:'
    },
    {
        name: 'emotional-damage',
        file: 'emotional-damage.m4a',
        title: 'Emotional damage :emotional_damage:'
    },
    {
        name: 'knekk',
        file: 'knekk.m4a',
        title: 'Knekk :mango-ipa-intensifies:'
    },
    {
        name: 'pet-dawg',
        file: 'pet-dawg.m4a',
        title: 'Can I pet that dawg? :dog:'
    },
    {
        name: 'supertirsdag',
        file: 'supertirsdag.m4a',
        title: 'Supertirsdag :tada:'
    },
    {
        name: 'tirsdag-skjer-ingenting',
        file: 'tirsdag-skjer-det-absolutt-ingenting.m4a',
        title: 'Tirsdag skjer det absolutt ingenting'
    },
    {
        name: 'varfor',
        file: 'varfor.wav',
        title: 'Varför? :sob:'
    },
    {
        name: 'whyyy',
        file: 'whyyy.mp3',
        title: 'Whyyy :whyyy:'
    }
];

const processSoundSelection = async (sound, channelId, client) => {
    try {
        const baseUrl = 'https://github.com/erikblomqvist/fredag-idag/raw/main/soundboard/';
        const soundUrl = `${baseUrl}${sound.file}`;
        
        const fileResponse = await axios.get(soundUrl, { responseType: 'arraybuffer' });

        // Convert buffer to readable stream
        const soundStream = new Readable();
        soundStream.push(fileResponse.data);
        soundStream.push(null);

        await client.files.uploadV2({
            channels: channelId,
            file: soundStream,
            filename: sound.title,
            title: sound.title
        });
    } catch (error) {
        console.error('Error in processSoundSelection: ', error);
    }
};

const soundboardCommand = async ({ command, ack, respond, client }) => {
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
            
            await respond(`:loading: Laster inn "${sound.title}"…`);
            
            await processSoundSelection(sound, channelId, client);
        } else {
            await respond(`Nei, den lyden finnes ikke. Du kan velge mellom disse: \`${soundboardOptions.map(o => o.name).join(', ')}\``);
        }
    } catch (error) {
        console.error('Error in soundboard command handler: ', error);
    }
};

module.exports = soundboardCommand;