'use strict';

const hpstalkOption = require("../data/hpstalk");
const _ = require('lodash');
const postcode = require('./postcode');
const moment = require('moment');
const fb = require('./facebook/core');
const cache = require('./cache');

exports.handle = function (response, sender) {

    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let action = response.result.action;
    let complete = !response.result.actionIncomplete;
    let parameters = response.result.parameters;
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
    if (_.findIndex(responseContexts, { "name": "hpstalk_information_dialog_params_date" }) >= 0) {
        let postcodeValidationResult = postcode.validatePostcode(parameters.postcode);
        if (!postcodeValidationResult) {
            fb.sendFBMessageText(sender, "Sorry, your postcode is out of our delivery area. Please try again by typing HPSTALK.");
        } else {
            fb.processResponseData(sender, responseData, responseText);
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_information_dialog_params_option" }) >= 0) {
        let dateValidationResult = validateDate(parameters.date)

        if (dateValidationResult) {
            fb.processResponseData(sender, responseData, responseText);    
            
            let shortId = cache.generateShortId();
            hpstalkOption.attachment.payload.elements[0].buttons[1].payload = "hpstalkOptionA" + "-" + shortId;
            hpstalkOption.attachment.payload.elements[1].buttons[1].payload = "hpstalkOptionB" + "-" + shortId;
                    
            fb.sendFBMessage(sender, hpstalkOption);
            //delay this delivery until option selected
            // fb.processResponseData(sender, responseData, responseText);
        } else {
            fb.sendFBMessageText(sender, "Sorry, your delivery date has to be at least 2 days in advance. Please try again by typing HPSTALK.");
        }
    } else {
        fb.processResponseData(sender, responseData, responseText);
    }
}

function validateDate(dateStr) {

    let deliveryDate = moment(dateStr);

    if (!deliveryDate.isValid()) {
        return false;
    }

    return deliveryDate.isAfter(moment().add(2, 'days')) && deliveryDate.isBefore(moment("2016-5-31"));
}
