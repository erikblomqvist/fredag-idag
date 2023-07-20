require('dotenv').config();
const { App, LogLevel } = require('@slack/bolt');

const app = new App({
    token: process.env.TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    logLevel: LogLevel.DEBUG,
});

app.message('Är det fredag idag?', async ({ message, say }) => {
    const d = new Date();
    const isFriday = (d.getDay() === 5) ? "Ja, mina bekanta. :fredag_mina_bekanta:" : "Nej. :fredag-idag:";

    await say(`Hej <@${message.user}>! ${isFriday}`);
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
