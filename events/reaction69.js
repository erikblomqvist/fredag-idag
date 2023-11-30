const moment = require('moment-timezone')

const reaction69Event = async ({ event, client }) => {
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
};

module.exports = reaction69Event;