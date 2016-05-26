'use strict';

const _ = require('lodash');
const globby = require('globby');

const API_URL = "http://dashboard.helprnow.com/";
const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Basic aGVscHI6aGVscHJiMHQ="
}

exports.API_URL = API_URL;
exports.HEADERS = HEADERS;

module.exports.getGlobbedFiles = function (globPatterns, removeRoot) {
    return globby.sync(globPatterns);
};