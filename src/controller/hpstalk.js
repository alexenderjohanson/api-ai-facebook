'use strict';

const data = require("../data/hpstalk");
const _ = require('lodash');
const location = require('./location');
const moment = require('moment');
const fb = require('./facebook/core');
const cache = require('./cache');
const user = require('./user');
const billplz = require('./billplz');
const apiai = require('./apiai');

const OPTION_A = "hpstalka";
const OPTION_B = "hpstalkb";
const CANCEL_ORDER = "cancelOrder-";
const MESSAGE_KEY = "hpstalk-message-";

exports.handle = function (response, sender, rawText) {

    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let action = response.result.action;
    let complete = !response.result.actionIncomplete;
    let parameters = response.result.parameters;
    let actionIncomplete = response.result.actionIncomplete;
    let responseContexts = response.result.contexts;

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

                let shortId = cache.generateShortId();
                data.fb_options.attachment.payload.elements[0].buttons[1].payload = OPTION_A + "-" + shortId;
                data.fb_options.attachment.payload.elements[1].buttons[1].payload = OPTION_B + "-" + shortId;

                fb.sendFBMessage(sender, data.fb_options);
            } catch (ex) {
                console.log(ex);
            }
        } else {
            fb.sendFBMessageText(sender, "Sorry, your delivery date has to be at least 2 days in advance and before 31/5.\nPlease try again another date");
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_sendername" }) >= 0) {

        let messageKey = MESSAGE_KEY + sender;
        cache.put(messageKey, rawText);

        fb.processResponseData(sender, responseData, responseText);
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_contact" }) >= 0) {
        let userProfile = cache.get(sender);
        if (!userProfile || !userProfile.phone) {
            fb.processResponseData(sender, responseData, responseText);
        } else {
            apiai.textRequest(userProfile.phone, sender);
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_dialog_params_email" }) >= 0) {
        let userProfile = cache.get(sender);
        console.log("userProfile:" + userProfile);
        if (!userProfile || !userProfile.email) {
            fb.processResponseData(sender, responseData, responseText);
        } else {
            apiai.textRequest(userProfile.email, sender);
        }
    } else if (!actionIncomplete) {

        let userProfile = cache.get(sender);
        let shouldUpdate = false;

        if (!userProfile.email) {
            userProfile.email = parameters.email;
            shouldUpdate = true;
        }

        if (!userProfile.phone) {
            userProfile.phone = parameters.contact;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            user.updateUser(userProfile).then(function (result) {

                if (!result && !result.user) {
                    cache.put(sender, result.user);
                }
            });
        }

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

function createReqeust(sender) {

    user.getUserByFbId(sender).then(function (userResult) {
        if (!userResult) {
            return fb.getFbUserProfile(sender).then(function (result) {
                console.log(result);
            })
        } else {
            return userResult
        }
    })
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

    if (parameters.address2.toLowerCase() == "na") {
        parameters.address2 = undefined;
    } else {
        parameters.address2 = `\n` + parameters.address2 + `,`;
    }

    let address = `${parameters.address1},${parameters.address2}\n${parameters.postcode}, ${locationResult.city},\n${locationResult.state}\n\n`
    let message = cache.get(MESSAGE_KEY + sender);

    let repeatMessage = `Let me repeat your order\nAddress:\n${address}Delivery Date: ${parameters.date}\nRecipient Name: ${parameters.recipientName}\nRecipient Contact: ${parameters.recipientContact}\nMessage:\n${message}\nName on card: ${parameters.senderName}`

    fb.sendFBMessageText(sender, repeatMessage);

    let shortId = cache.generateShortId();
    data.payment.attachment.payload.buttons[1].payload = CANCEL_ORDER + "-" + shortId;

    //generate payment link
    let userProfile = cache.get(sender);
    let contact = parameters.contact || userProfile.phone;
    let email = parameters.email || userProfile.email;
    let productDetail = _.find(data.options, { collection_id: parameters.option });
    console.log(productDetail);
    billplz.generatePaymentLink(productDetail.collection_id, userProfile.name, email, contact, productDetail.price, productDetail.title).then(function (result) {

        if (!result) {
            fb.sendFBMessageText(sender, "Whoops, we lost your order in the matrix. Neo is on it.");
        }
        let payment = data.payment;
        payment.attachment.payload.buttons[0].url = result.url;
        fb.sendFBMessage(sender, payment);
    });
}