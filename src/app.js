'use strict';

const request = require('request');
const fetch = require('node-fetch');
const _ = require('lodash');
const moment = require('moment');
const appConfig = require('../app');

const apiaiController = require('./controller/apiai');
const postback = require('./controller/facebook/postback');
const cache = require('./controller/cache');
const user = require('./controller/user');
const fb = require('./controller/facebook/core');


const REST_PORT = (process.env.PORT || 5000);
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || appConfig.env.FB_VERIFY_TOKEN;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || appConfig.env.FB_PAGE_ACCESS_TOKEN;

const contexts = new Map();
const orders = new Map();
const addresses = new Map();

function processEvent(event) {
    var senderId = event.sender.id;

    let cachedUser = cache.get(senderId);

    if (cachedUser === undefined) {
        try {
            user.getUserByFbId(senderId).then(function (userResult) {

                if (userResult.length === 0) {
                    fb.getFbUserProfile(senderId).then(function (result) {

                        if (result) {
                            user.createUser(senderId, result).then(function (result) {
                                if (!result && result.lenght > 0) {
                                    cache.put(senderId, result[0]);
                                }
                            });
                        }
                    });
                } else {
                    cache.put(senderId, userResult[0]);
                }
            });
        } catch (ex) {
            console.log(ex);
        }
    }

    if (event.postback) {

        try {
            let response = postback.handle(senderId, event.postback.payload);
            console.log("postback response:" + JSON.stringify(response));
            if (response.recur) {

                console.log(response);

                let newEvent = event;
                newEvent.postback = undefined;
                newEvent.message = response;
                processEvent(newEvent);
            } else {
                console.log("sending postback data");
                fb.sendFBMessage(senderId, response);
            }
        } catch (err) {
            console.log(err);
        }
    } else if (event.message && event.message.text) {
        let text = event.message.text;

        apiaiController.textRequest(text, senderId);
    }
}

// function processResponseData(sender, responseData, responseText) {

//     // console.log(responseData);

//     if (isDefined(responseData) && isDefined(responseData.facebook)) {
//         try {
//             console.log('Response as formatted message');
//             sendFBMessage(sender, responseData.facebook);
//         } catch (err) {
//             sendFBMessage(sender, { text: err.message });
//         }
//     } else if (isDefined(responseText)) {
//         console.log('Response as text message');
//         // facebook API limit for text length is 320,
//         // so we split message if needed
//         var splittedText = splitResponse(responseText);

//         for (var i = 0; i < splittedText.length; i++) {
//             sendFBMessage(sender, { text: splittedText[i] });
//         }
//     }
// }

// function splitResponse(str) {
//     if (str.length <= 320) {
//         return [str];
//     }

//     var result = chunkString(str, 300);

//     return result;

// }

// function chunkString(s, len) {
//     var curr = len, prev = 0;

//     var output = [];

//     while (s[curr]) {
//         if (s[curr++] == ' ') {
//             output.push(s.substring(prev, curr));
//             prev = curr;
//             curr += len;
//         }
//         else {
//             var currReverse = curr;
//             do {
//                 if (s.substring(currReverse - 1, currReverse) == ' ') {
//                     output.push(s.substring(prev, currReverse));
//                     prev = currReverse;
//                     curr = currReverse + len;
//                     break;
//                 }
//                 currReverse--;
//             } while (currReverse > prev)
//         }
//     }
//     output.push(s.substr(prev));
//     return output;
// }

// function sendFBMessage(sender, messageData) {

//     request({
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: { access_token: FB_PAGE_ACCESS_TOKEN },
//         method: 'POST',
//         json: {
//             recipient: { id: sender },
//             message: messageData
//         }
//     }, function (error, response, body) {
//         if (error) {
//             console.log('Error sending message: ', error);
//         } else if (response.body.error) {
//             console.log('Error: ', response.body.error);
//         }
//     });
// }

// function sendFBMessageText(sender, messageText) {
//     let messageData = {
//         "text": messageText
//     };
//     sendFBMessage(sender, messageData);
// }

function doSubscribeRequest() {

    request({
        method: 'POST',
        uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + FB_PAGE_ACCESS_TOKEN
    },
        function (error, response, body) {
            if (error) {
                console.error('Error while subscription: ', error);
            } else {
                console.log('Subscription result: ', response.body);
            }
        });
}

const app = require('./config/express')();

app.get('/webhook/', function (req, res) {

    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);

        setTimeout(function () {
            doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/webhook/', function (req, res) {

    try {

        var messaging_events = req.body.entry[0].messaging;

        for (var i = 0; i < messaging_events.length; i++) {
            var event = messaging_events[i];
            processEvent(event);
        }

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        return res.status(400).json({
            status: "error",
            error: err
        });
    }

});

app.listen(REST_PORT, function () {
    console.log('Rest service ready on port ' + REST_PORT);
});

// Expose app
exports = module.exports = app;

// let userProfile = { "id": 29, "email": "alexenderjohanson@yahoo.com", "uid": "1121605954527014", "name": "Johanson Chew", "phone": "012-9713303" };
// user.updateUser(userProfile).then(function (userResult) {
//     console.log("DEBUG USER:" + JSON.stringify(userResult));
// });


// user.getUserByFbId("1121605954527014").then(function(user){
//     console.log("DEBUG USER:" + JSON.stringify(user));
// });

// fb.getFbUserProfile("1121605954527014").then(function (user) {
//     console.log("DEBUG USER:" + JSON.stringify(user));
// });

doSubscribeRequest();
