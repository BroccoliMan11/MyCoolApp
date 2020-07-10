const moment = require('moment');

function formatMessage(user, text){
    return {
        user: user,
        text: text,
        time: moment().format('h:mm a')
    };
}

module.exports = formatMessage;