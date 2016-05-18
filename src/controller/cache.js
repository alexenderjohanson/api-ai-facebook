'use strict';

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
const shortid = require('shortid');

exports.generateShortId = function () {

    const id = shortid.generate();
    myCache.set(id, true);

    return id;
}

exports.popShortId = function (id) {
    
    const value = myCache.get(id);
    if (value == undefined) {
        return false; 
    }
    
    value = myCache.del(id);
    return true;
}