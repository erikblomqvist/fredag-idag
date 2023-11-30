const moment = require('moment-timezone');

const checkFriday = d => d.day() === 5

const isItFridayTodayMessage = async ({ say }) => {
    const d = moment().tz('Europe/Oslo');

    const isFriday = checkFriday(d);
    let response;

    if (isFriday) {
        response = "Ja, mina bekanta. :fredag_mina_bekanta:";
    } else {
        response = "Nej. :fredag-idag:";
    }

    await say(response);
};

module.exports = isItFridayTodayMessage;