'use strict';

const apiai = require('apiai');
const uuid = require('node-uuid');
const request = require('request');
const fetch = require('node-fetch');
const _ = require('lodash');
const moment = require('moment');
const hpstalk = require('./controller/hpstalk');
const apiaiController = require('./controller/apiai');

const appConfig = require('../app');
const REST_PORT = (process.env.PORT || 5000);
const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN || appConfig.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = process.env.APIAI_LANG || 'en';
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || appConfig.env.FB_VERIFY_TOKEN;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || appConfig.env.FB_PAGE_ACCESS_TOKEN;

const apiAiService = apiai(APIAI_ACCESS_TOKEN, { language: APIAI_LANG, requestSource: "fb" });
const sessionIds = new Map();
const contexts = new Map();
const userProfiles = new Map();
const orders = new Map();
const addresses = new Map();

function processEvent(event) {
    var sender = event.sender.id;

    if (event.postback) {

        try {
            let response = handlePostback(sender, event.postback.payload);

            if (response.recur) {
                event.postback = undefined;
                event.message = response;
                processEvent(event);
            } else {
                console.log("sending postback data");
                sendFBMessage(sender, response);
            }
        } catch (err) {
            console.log(err)
        }
    } else if (event.message && event.message.text) {
        let text = event.message.text;
        // Handle a text message from this sender

        if (!sessionIds.has(sender)) {
            sessionIds.set(sender, uuid.v1());
            getFbUserProfile(sender).then(function (profile) {
                userProfiles.set(sender, profile);
            })
        }

        let context = null;
        if (contexts.has(sender)) {
            context = contexts.get(sender);
            contexts.delete(sender);
        }

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
                sessionId: sessionIds.get(sender),
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
                let userProfile = userProfiles.get(sender);

                // contexts.set(sender, resultContexts);
                if (action == "get-user" && complete) {

                    sendFBMessageText(sender, `Name: ${userProfile.first_name} ${userProfile.last_name}\nGender: ${userProfile.gender}\nTime zone: ${userProfile.timezone}`);

                } else if (_.findIndex(responseContexts, { "name": "hpstalk" })) {

                    hpstalk.handle(response, sender);
                } else if (action == "get-address" && complete) {

                    let foodOrderingContext = _.find(responseContexts, { "name": "food-ordering" });
                    // console.log("foodOrderingContext:" + JSON.stringify(foodOrderingContext));

                    if (!foodOrderingContext) {
                        sendFBMessageText(sender, "Whoops, we lost your order in the matrix. Neo is on it.");
                        return;
                    }

                    try {
                        let contextParameters = foodOrderingContext.parameters;

                        //add address to address book
                        addresses.set(sender, contextParameters.address);

                        let repeatOrder = `Let me repeat your order: \nName: ${userProfile.first_name} \nContact: ${contextParameters.contact} \nAddress: ${contextParameters.address} \nFood: ${contextParameters.food}`

                        let order = Object.assign({}, userProfile, foodOrderingContext.parameters);
                        orders.set(sender, order);
                        // console.log(order);

                        let messageData = {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "generic",
                                    "elements": [{
                                        "title": "Confirm your order above?",
                                        "buttons": [
                                            {
                                                "type": "postback",
                                                "payload": "confirm-order",
                                                "title": "Confirm"
                                            },
                                            {
                                                "type": "postback",
                                                "title": "Cancel",
                                                "payload": "cancel-order",
                                            }
                                        ],
                                    }]
                                }
                            }
                        };

                        sendFBMessageText(sender, repeatOrder);
                        sendFBMessage(sender, messageData);
                    } catch (err) {
                        sendFBMessage(sender, { text: err.message });
                    }

                } else if (action == "food-ordering" && complete) {

                    try {
                        let address = addresses.get(sender);

                        console.log("address" + address);

                        if (address) {
                            let messageData = {
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "button",
                                        "text": `Should we deliver to this address address?\n${address}`,
                                        "buttons": [
                                            {
                                                "type": "postback",
                                                "payload": "use-existing-address",
                                                "title": "Yes"
                                            },
                                            {
                                                "type": "postback",
                                                "title": "No",
                                                "payload": "enter-new-address",
                                            }
                                        ],
                                    }
                                }
                            };

                            sendFBMessage(sender, messageData);
                        } else {
                            processResponseData(sender, responseData, responseText);
                        }
                    } catch (err) {
                        sendFBMessage(sender, { text: err.message });
                    }
                } else if (isDefined(responseData) && isDefined(responseData.facebook)) {
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

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
    }
}

function processResponseData(sender, responseData, responseText) {

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
            } while (currReverse > prev)
        }
    }
    output.push(s.substr(prev));
    return output;
}

function getFbUserProfile(fbUserId) {

    return fetch(`https://graph.facebook.com/v2.6/${fbUserId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${FB_PAGE_ACCESS_TOKEN}`).then(function (res) {
        return res.json();
    }).then(function (json) {
        return json;
    }, function (error) {
        console.log(error);
    });
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

function sendFBMessageText(sender, messageText) {
    let messageData = {
        "text": messageText
    };
    sendFBMessage(sender, messageData);
}

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

function handlePostback(sender, payload) {

    let response = {};
    if (payload == "confirm-order") {
        let order = orders.get(sender);
        orders.delete(sender);
        // let f = {
        //     first_name: 'Johanson',
        //     last_name: 'Chew',
        //     profile_pic: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1377497_10151773468449760_1886125195_n.jpg?oh=ce45faea2d5661b6004fc6cedf71b4a3&oe=57E64824',
        //     locale: 'en_GB',
        //     timezone: 8,
        //     gender: 'male',
        //     food: 'Roti Canai',
        //     contact: '0129813030', address: '12 dsjfskj skdjf'
        // }

        if (!order) {
            return {
                "text": "This order is expired. Please start a new order."
            }
        }

        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "receipt",
                    "recipient_name": order.first_name + order.last_name,
                    "order_number": "12345678902",
                    "currency": "MYR",
                    "payment_method": "Billplz",
                    "order_url": "http://petersapparel.parseapp.com/order?order_id=123456",
                    "timestamp": moment().seconds(),
                    "elements": [
                        {
                            "title": "Food order",
                            "subtitle": order.food,
                            "price": 50,
                            "currency": "MYR",
                        },
                    ],
                    "address": {
                        "street_1": "1 Hacker Way",
                        "street_2": "",
                        "city": "Menlo Park",
                        "postal_code": "94025",
                        "state": "CA",
                        "country": "US"
                    },
                    "summary": {
                        "subtotal": 75.00,
                        "shipping_cost": 4.95,
                        "total_tax": 6.19,
                        "total_cost": 56.14
                    },
                    "adjustments": [
                        {
                            "name": "New Customer Discount",
                            "amount": 20
                        },
                        {
                            "name": "$10 Off Coupon",
                            "amount": 10
                        }
                    ]
                }
            }
        }

        return response;
    } else if (payload == "service-list") {


        // let text = JSON.stringify(payload);
    } else if (payload == "use-existing-address") {
        response = {
            "recur": true,
            "text": addresses.get(sender)
        }

    } else if (payload == "enter-new-address") {
        response = {
            "text": "Please enter new address"
        }
    }

    return response;
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
