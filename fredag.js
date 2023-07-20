require('dotenv').config();
const { App, LogLevel } = require("@slack/bolt");
const express = require('express');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});

app.message('Är det fredag idag?', async ({ say }) => {
  const d = new Date();
  const isFriday = (d.getDay() === 5) ? "Ja, mina bekanta. :fredag_mina_bekanta:" : "Nej. :fredag-idag:";
  await say(isFriday);
});

app.message(/Varför?/i, async ({ say }) => {
    await say (':sob: :sob: :banana:')
});

(async () => {
  const server = express();

  server.all('/slack/events', (req, res) => {
    res.status(200).send('Ok');
  });

  await app.start(process.env.PORT || 3000);
  console.log('Fredag is running!');
})();
