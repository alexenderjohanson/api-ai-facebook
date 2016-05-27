'use strict';

const request = require('request');
const fetch = require('node-fetch');
const appConfig = require('../../../app');
const moment = require('moment');

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || appConfig.env.FB_PAGE_ACCESS_TOKEN.value;

exports.processResponseData = function (sender, responseData, responseText) {

    // console.log(responseData);

    if (isDefined(responseData) && isDefined(responseData.facebook)) {
        try {
            console.log('Response:' + responseData.facebook);
            sendFBMessage(sender, responseData.facebook);
        } catch (err) {
            sendFBMessage(sender, { text: err.message });
        }
    } else if (isDefined(responseText)) {
        console.log('Response:' + responseText);
        // facebook API limit for text length is 320,
        // so we split message if needed
        var splittedText = splitResponse(responseText);

        for (var i = 0; i < splittedText.length; i++) {
            sendFBMessage(sender, { text: splittedText[i] });
        }
    }
};

exports.sendFBMessage = sendFBMessage;
exports.sendFBMessageText = sendFBMessageText;

function sendFBMessageText(sender, messageText) {
    let messageData = {
        "text": messageText
    };
    sendFBMessage(sender, messageData);
}

function sendFBMessage(sender, messageData) {

    console.log("sender:", sender);
    console.log("data:", messageData);

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FB_PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj !== null;
}

function splitResponse(str) {
    if (str.length <= 320) {
        return [str];
    }

    var result = chunkString(str, 300);

    return result;

}

function chunkString(s, len) {
    var curr = len, prev = 0;

    var output = [];

    while (s[curr]) {
        if (s[curr++] == ' ') {
            output.push(s.substring(prev, curr));
            prev = curr;
            curr += len;
        }
        else {
            var currReverse = curr;
            do {
                if (s.substring(currReverse - 1, currReverse) == ' ') {
                    output.push(s.substring(prev, currReverse));
                    prev = currReverse;
                    curr = currReverse + len;
                    break;
                }
                currReverse--;
            } while (currReverse > prev);
        }
    }
    output.push(s.substr(prev));
    return output;
}

exports.getFbUserProfile = getFbUserProfile;

function getFbUserProfile(fbUserId) {

    let url = `https://graph.facebook.com/v2.6/${fbUserId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${FB_PAGE_ACCESS_TOKEN}`;

    return fetch(url).then(function (res) {
        return res.json();
    }).then(function (json) {
        return json;
    }, function (error) {
        console.log(error);
    });
}

exports.apiSendFBMessageText = function (req, res, next) {

    let fbId = req.params.fbId;
    let message = req.body.text;
    sendFBMessageText(fbId, message);

    res.json({});
}

exports.sendReceipt = function (sender, orderId, title, subtitle, recipient, price, address1, address2, city, postcode, state) {

    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "receipt",
                "recipient_name": recipient,
                "order_number": orderId,
                "currency": "MYR",
                "payment_method": "Billplz",
                "timestamp": moment().unix(),
                "elements": [
                    {
                        "title": title,
                        "subtitle": subtitle,
                        "price": price,
                        "currency": "MYR",
                    },
                ],
                "address": {
                    "street_1": address1,
                    "street_2": address2,
                    "city": city,
                    "postal_code": postcode,
                    "state": state,
                    "country":"Malaysia"
                },
                "summary": {
                    "total_cost": price
                }
            }
        }
    };

    sendFBMessage(sender, response);
}