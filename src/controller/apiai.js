'use strict';
const cache = require('./cache');
const hpstalk = require('./hpstalk');

const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN || appConfig.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = process.env.APIAI_LANG || 'en';
const apiAiService = apiai(APIAI_ACCESS_TOKEN, { language: APIAI_LANG, requestSource: "fb" });
const sessionIds = new Map();

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

exports.textRequest = function (text, senderId) {

    if (!sessionIds.has(senderId)) {
        sessionIds.set(senderId, uuid.v1());
    }

    let apiaiRequest = apiAiService.textRequest(text,
        {
            sessionId: sessionIds.get(senderId),
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
