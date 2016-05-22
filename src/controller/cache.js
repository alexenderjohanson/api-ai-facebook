'use strict';

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
const shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

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

    myCache.del(id);
    return true;
}

exports.put = function (key, object) {
    myCache.set(key, object);
}

exports.get = function (key) {
    return myCache.get(key);
}

exports.pop = function (key) {
    const value = myCache.get(id);
    if (value == undefined) {
        return;
    }

    myCache.del(id);
    return value;
}