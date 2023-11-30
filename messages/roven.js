const moment = require('moment-timezone');

const checkFriday = d => d.day() === 5

const rovenMessage = async ({ say }) => {
    const d = moment().tz('Europe/Oslo');

    const isFriday = checkFriday(d);
    let response;

    if (isFriday) {
        response = "Lugna ner dig nu, det är ju fredag.' :fredag_mina_bekanta:";
    } else {
        response = "Lugna ner dig nu, kukunge. :shushing_face: :pelle_big_black_hat:";
    }

    await say(response);
};

module.exports = rovenMessage;