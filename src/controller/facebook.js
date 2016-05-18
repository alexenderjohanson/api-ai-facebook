'use strict';

const request = require('request');
const appConfig = require('../../app');

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || appConfig.env.FB_PAGE_ACCESS_TOKEN;

exports.processResponseData= function(sender, responseData, responseText) {

    console.log(responseData);

    if (isDefined(responseData) && isDefined(responseData.facebook)) {
        try {
            console.log('Response as formatted message');
            sendFBMessage(sender, responseData.facebook);
        } catch (err) {
            sendFBMessage(sender, { text: err.message });
        }
    } else if (isDefined(responseText)) {
        console.log('Response as text message');
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