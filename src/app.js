'use strict';

const apiai = require('apiai');
const uuid = require('node-uuid');
const request = require('request');
const fetch = require('node-fetch');
const _ = require('lodash');
const moment = require('moment');
const hpstalk = require('./controller/hpstalk');
const apiaiController = require('./controller/apiai');
const postback = require('./controller/facebook/postback');
const cache = require('./controller/cache');
const user = require('./controller/user');
const fb = require('./controller/facebook/core');

const appConfig = require('../app');
const REST_PORT = (process.env.PORT || 5000);
const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN || appConfig.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = process.env.APIAI_LANG || 'en';
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || appConfig.env.FB_VERIFY_TOKEN;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || appConfig.env.FB_PAGE_ACCESS_TOKEN;

const apiAiService = apiai(APIAI_ACCESS_TOKEN, { language: APIAI_LANG, requestSource: "fb" });
const sessionIds = new Map();
const contexts = new Map();
const orders = new Map();
const addresses = new Map();

function processEvent(event) {
    var senderId = event.sender.id;

    let cachedUser = cache.get(senderId);

    if (!cacheUser) {
        
        console.log("get user by fb id");
        
        try {
            user.getUserByFbId(senderId).then(function (userResult) {
                
                console.log(userResult);
                
                if (!userResult) {
                    return fb.getFbUserProfile(senderId).then(function (result) {
                        console.log(result);
                    })
                } else {
                    console.log(userResult);
                }
            })
        } catch (ex) {
            console.log(ex);
        }
    }

    if (event.postback) {

        try {
            let response = postback.handle(senderId, event.postback.payload);

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
            console.log(err)
        }
    } else if (event.message && event.message.text) {
        let text = event.message.text;

        console.log("text:" + text);
        // Handle a text message from this sender

        if (!sessionIds.has(senderId)) {
            sessionIds.set(senderId, uuid.v1());
        }

        let context = null;
        // if (contexts.has(sender)) {
        //     context = contexts.get(sender);
        //     contexts.delete(sender);
        // }

        // if (context && context.length) {
        //     let name = context[0].name;

        //     if (name == "jom_makan_dialog_params_address") {
        //         context = context.splice(0, 1);
        //         context[0].parameters.address;
        //         text = "";
        //     }
        // }

        let apiaiRequest = apiAiService.textRequest(text,
            {
                sessionId: sessionIds.get(senderId),
                context: context,
                resetContexts: apiaiController.shouldClearContext(text)
            });

        apiaiRequest.on('response', (response) => {
            if (isDefined(response.result)) {
                let responseText = response.result.fulfillment.speech;
                let responseData = response.result.fulfillment.data;
                let action = response.result.action;
                let complete = !response.result.actionIncomplete;
                let parameters = response.result.parameters;
                let responseContexts = response.result.contexts;
                let userProfile = userProfiles.get(senderId);

                // contexts.set(sender, resultContexts);
                // if (action == "get-user" && complete) {

                //     sendFBMessageText(sender, `Name: ${userProfile.first_name} ${userProfile.last_name}\nGender: ${userProfile.gender}\nTime zone: ${userProfile.timezone}`);

                // } else
                if (action == "hpstalk") {

                    hpstalk.handle(response, senderId, text);
                }
                //else  if (action == "get-address" && complete) {

                //     let foodOrderingContext = _.find(responseContexts, { "name": "food-ordering" });
                //     // console.log("foodOrderingContext:" + JSON.stringify(foodOrderingContext));

                //     if (!foodOrderingContext) {
                //         sendFBMessageText(sender, "Whoops, we lost your order in the matrix. Neo is on it.");
                //         return;
                //     }

                //     try {
                //         let contextParameters = foodOrderingContext.parameters;

                //         //add address to address book
                //         addresses.set(sender, contextParameters.address);

                //         let repeatOrder = `Let me repeat your order: \nName: ${userProfile.first_name} \nContact: ${contextParameters.contact} \nAddress: ${contextParameters.address} \nFood: ${contextParameters.food}`

                //         let order = Object.assign({}, userProfile, foodOrderingContext.parameters);
                //         orders.set(sender, order);
                //         // console.log(order);

                //         let messageData = {
                //             "attachment": {
                //                 "type": "template",
                //                 "payload": {
                //                     "template_type": "generic",
                //                     "elements": [{
                //                         "title": "Confirm your order above?",
                //                         "buttons": [
                //                             {
                //                                 "type": "postback",
                //                                 "payload": "confirm-order",
                //                                 "title": "Confirm"
                //                             },
                //                             {
                //                                 "type": "postback",
                //                                 "title": "Cancel",
                //                                 "payload": "cancel-order",
                //                             }
                //                         ],
                //                     }]
                //                 }
                //             }
                //         };

                //         sendFBMessageText(sender, repeatOrder);
                //         sendFBMessage(sender, messageData);
                //     } catch (err) {
                //         sendFBMessage(sender, { text: err.message });
                //     }

                // } else if (action == "food-ordering" && complete) {

                //     try {
                //         let address = addresses.get(sender);

                //         console.log("address" + address);

                //         if (address) {
                //             let messageData = {
                //                 "attachment": {
                //                     "type": "template",
                //                     "payload": {
                //                         "template_type": "button",
                //                         "text": `Should we deliver to this address address?\n${address}`,
                //                         "buttons": [
                //                             {
                //                                 "type": "postback",
                //                                 "payload": "use-existing-address",
                //                                 "title": "Yes"
                //                             },
                //                             {
                //                                 "type": "postback",
                //                                 "title": "No",
                //                                 "payload": "enter-new-address",
                //                             }
                //                         ],
                //                     }
                //                 }
                //             };

                //             sendFBMessage(sender, messageData);
                //         } else {
                //             processResponseData(sender, responseData, responseText);
                //         }
                //     } catch (err) {
                //         sendFBMessage(sender, { text: err.message });
                //     }
                // } else if (isDefined(responseData) && isDefined(responseData.facebook)) {
                //     try {
                //         console.log("response:" + responseData.facebook)
                //         sendFBMessage(sender, responseData.facebook);
                //     } catch (err) {
                //         sendFBMessage(sender, { text: err.message });
                //     }
                // } else if (isDefined(responseText)) {
                //     console.log("response:" + responseText);
                //     // facebook API limit for text length is 320,
                //     // so we split message if needed
                //     var splittedText = splitResponse(responseText);

                //     for (var i = 0; i < splittedText.length; i++) {
                //         sendFBMessage(sender, { text: splittedText[i] });
                //     }
                // }

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
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

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj !== null;
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

doSubscribeRequest();
