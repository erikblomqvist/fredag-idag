require('dotenv').config();
const { App, LogLevel } = require("@slack/bolt");
const express = require('express');
const moment = require('moment-timezone');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});

app.message('Är det fredag idag?', async ({ say }) => {
  const d = moment().tz('Europe/Oslo');
  const isFriday = (d.day() === 5)
    ? "Ja, mina bekanta. :fredag_mina_bekanta:"
    : "Nej. :fredag-idag:";
  await say(isFriday);
});

app.message(/Varför?/i, async ({ say }) => {
  const d = moment().tz('Europe/Oslo');
  const isFriday = (d.day() === 5)
    ? "Så är det bara. :fredag_mina_bekanta:"
    : ":sob: :sob: :banana:";
  await say(isFriday);
});

(async () => {
  const server = express();

  server.all('/slack/events', (req, res) => {
    res.status(200).send('Ok');
  });

  await app.start(process.env.PORT || 3000);
  console.log('Fredag is running!');
})();
