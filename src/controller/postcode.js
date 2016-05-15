'use strict';

const postcodeJson = require('../data/postcode');
const _ = require('lodash');

exports.validatePostcode = function (postcode) {
    
    let index = _.findIndex(postcodeJson, { "postcode": postcode });
    
    if(index < 0){
        return false;
    }
    
    return postcodeJson[index];
}