const moment = require('moment-timezone')

const copyableReactions = [
    '69',
    'no-teeth',
    'dino_dance'
]

const copyReactionEvent = async ({ event, client }) => {
    try {
        if(copyableReactions.includes(event.reaction)) {
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
                    name: event.reaction
                });
            }
        }
    } catch (error) {
        console.error('Error in reaction_added event handler: ', error);
    }
};

module.exports = copyReactionEvent;