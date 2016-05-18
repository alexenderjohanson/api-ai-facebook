'use strict';

const hpstalkOption = require("../data/hpstalk");
const _ = require('lodash');
const postcode = require('./postcode');
const moment = require('moment');
const fb = require('./facebook');

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

    //user currently in date context, means we have postcode already
    if (_.findIndex(responseContexts, { "name": "hpstalk_information_dialog_params_date" })) {
        let postcodeValidationResult = postcode.validatePostcode(parameters.postcode);
        if (!postcodeValidationResult) {
          fb.sendFBMessageText(sender, "Sorry, your postcode is out of our delivery area. Please try again by typing HPSTALK.");
        } else {
          fb.processResponseData(sender, responseData, responseText);
        }
    } else if (_.findIndex(responseContexts, { "name": "hpstalk_information_dialog_params_date" })) {
        let dateValidationResult = validateDate(parameters.date)

        if(parameters){
          fb.processResponseData(sender, responseData, responseText);
        } else {
          fb.sendFBMessageText(sender, "Sorry, your delivery date has to be at least 2 days in advance.");
        }
    }

    fb.processResponseData(sender, responseData, responseText);


}

function validateDate(dateStr) {

    let deliveryDate = moment(dateStr);

    if (!deliveryDate.isValid()) {
        return false;
    }

    return deliveryDate.isAfter(moment().add(2, 'days'));
}
