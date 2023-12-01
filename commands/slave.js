const adminUserIds = [
    'U05E2B95C11', // Erik
    'U05EF3TUUCR' // Dambakk
];

const slackCommand = async ({ command, ack, respond, client }) => {
    await ack();

    try {
        if(!adminUserIds.includes(command.user_id)) {
            await respond({
                response_type: 'ephemeral',
                text: 'Do er inte ådmin, så inte forsoka styr åt mej! :middle_finger:'
            });

            return;
        }
        
        let {
            text,
            channel_id: channel
        } = command

        // Channel users
        const usersResult = await client.users.list();
        const users = usersResult.members.reduce((acc, user) => {
            acc[`@${user.name}`] = `<@${user.id}>`;

            return acc;
        }, {});

        // Replace @username with <@userID>
        for(const userName in users) {
            text = text.replace(new RegExp(userName, 'g'), users[userName]);
        }

        console.log({ text });

        await client.chat.postMessage({
            channel,
            text
        });
    } catch (error) {
        console.error('Error in slack command handler: ', error);
    }
};

module.exports = slackCommand;