'use strict';

const data = require("../data/hpstalk");
const _ = require('lodash');
const location = require('./location');
const moment = require('moment');
const fb = require('./facebook/core');
const cache = require('./cache');

const OPTION_A = "hpstalkOptionA";
const OPTION_B = "hpstalkOptionB";
const MESSAGE_KEY = "hpstalk-message-";

exports.handle = function (response, sender, rawText) {

    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let action = response.result.action;
    let complete = !response.result.actionIncomplete;
    let parameters = response.result.parameters;
    let actionIncomplete = response.result.actionIncomplete;
    let responseContexts = response.result.contexts;
    // let userProfile = userProfiles.get(sender);

    // PARAMETERS
    // address1
    // address2
    // date
    // message
    // postcode
    // recipient-contact
    // recipient-name

    console.log(parameters);

    //user currently in date context, means we have postcode already
    if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_date" }) >= 0) {
        let postcodeValidationResult = location.validatePostcode(parameters.postcode);
        if (!postcodeValidationResult) {
            fb.sendFBMessageText(sender, "Sorry, your postcode is out of our delivery area. Please try again by typing HPSTALK.");
        } else {
            fb.processResponseData(sender, responseData, responseText);
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_option" }) >= 0) {
        let dateValidationResult = validateDate(parameters.date)

        if (dateValidationResult) {
            fb.processResponseData(sender, responseData, responseText);

            try {
                console.log(data);

                let shortId = cache.generateShortId();
                data.options.attachment.payload.elements[0].buttons[1].payload = OPTION_A + "-" + shortId;
                data.options.attachment.payload.elements[1].buttons[1].payload = OPTION_B + "-" + shortId;

                fb.sendFBMessage(sender, data.options);
            } catch (ex) {
                console.log(ex);
            }
        } else {
            fb.sendFBMessageText(sender, "Sorry, your delivery date has to be at least 2 days in advance. Please try again another date");
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_sendername" }) >= 0){
        
        let messageKey = MESSAGE_KEY + sender;
        cache.put(messageKey, rawText);
        
        fb.processResponseData(sender, responseData, responseText);
    } else if (!actionIncomplete) {

        repeatOrder(sender, parameters);
        createReqeust(parameters);
    } else {
        fb.processResponseData(sender, responseData, responseText);
    }
}

function validateDate(dateStr) {

    let deliveryDate = moment(dateStr);

    if (!deliveryDate.isValid()) {
        return false;
    }

    return deliveryDate.isAfter(moment().add(2, 'days')) && deliveryDate.isBefore(moment("2016-5-31", "YYYY-MM-DD"));
}

function createReqeust() {

}

function repeatOrder(sender, parameters) {

    // address1
    // address2
    // date
    // message
    // postcode
    // recipient-contact
    // recipient-name

    let locationResult = location.validatePostcode(parameters.postcode);

    let address = `${parameters.address1}\n${parameters.address2}\n${parameters.postcode}, ${locationResult.city},\n${location.state}\n\n`
    let message = cache.get(MESSAGE_KEY + sender);

    let repeatMessage = `Let me repeat your order\nAddress:${address}Delivery Date: ${parameters.date}\nRecipient Name: ${parameters.recipientName}\nRecipient Contact: ${parameters.recipientContact}\nMessage:\n${message}\nName on card: ${parameters.senderName}`

    fb.sendFBMessageText(sender, repeatMessage);

    let payment = data.payment;
    fb.sendFBMessage(payment);
}