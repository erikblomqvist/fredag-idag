require('dotenv').config()
const { App, LogLevel } = require("@slack/bolt")
const express = require('express')

// Messages
const isItFridayTodayMessage = require('./messages/fredagIdag');
const rovenMessage = require('./messages/roven');
const whyMessage = require('./messages/why');

// Events
const copyReactionEvent = require('./events/copy-reaction');

// Commands
const { greetCommand, scheduleRandomGreeting } = require('./commands/greet');
const davidCommand = require('./commands/david');
const soundboardCommand = require('./commands/soundboard');
const slaveCommand = require('./commands/slave');


const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: LogLevel.DEBUG
})


// Messages
app.message('Är det fredag idag?', isItFridayTodayMessage);
app.message('Röven!', rovenMessage);
app.message(/Varför\?/i, whyMessage);

// Events
app.event('reaction_added', copyReactionEvent);

// Commands
app.command('/greet', greetCommand);
    scheduleRandomGreeting();
app.command('/dåvid', davidCommand);
app.command('/soundboard', soundboardCommand);
app.command('/fredag', slaveCommand);


(async () => {
    const server = express()

    server.all('/slack/events', (req, res) => {
        res.status(200).send('Ok')
    })

    await app.start(process.env.PORT || 3000)
    console.log('⚡️ Fredag är igång och då … då känns det som fredag!')
})()