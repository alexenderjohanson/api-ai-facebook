'use strict';

const NodeCache = require("node-cache");
const uuid = require('node-uuid');
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

exports.generateShortId = function () {

    const id = uuid.v1();
    myCache.set(id, true);

    return id;
}

exports.popShortId = function (id) {
    
    const value = myCache.get(id);
    if (value == undefined) {
        return false; 
    }
    
    myCache.del(id);
    return true;
}