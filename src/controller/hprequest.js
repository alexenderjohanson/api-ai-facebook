'use strict';

const rp = require('request-promise');
const config = require('../config/config');

exports.createRequest = function (userId, category, billplzId, raw) {

    // request[category]=Gift
    // request[order][billplz_api]=12345`
    // request[description]
    // request[due_at]
    // request[requestable][recipient_address]
    
    console.log("create request. userId:" + userId)

    let form = {
        "request[category]": category,
        // "request[order][billplz_api]": billplzId,
        "request[description]": raw
    };

    // http://dashboard.helprnow.com/api/v1/users/32/requests.json

    let options = {
        uri: `${config.API_URL}api/v1/users/${userId}/requests.json}`,
        headers: config.HEADERS,
        method: 'POST',
        json: true,
        form: form
    };

    return rp(options).then(function (result) {
        return result;
    }).catch(function (err) {
        console.log(err);
    });

};
