'use strict';
const cache = require('./cache');

exports.shouldClearContext = function (text) {
    if (text === "hpstalk") {
        return true;
    }

    return false;
}

exports.getInitialContext = function (text, senderId) {
    if (text === "hpstalk") {

        let user = cache.get(senderId);

        if (!user) {
            return [{ title: "initial" }];
        }

        return [{
            title: "initial",
            parameters: {
                email: user.email,
                contact: user.phone
            }
        }]
    }

    return undefined;
}
