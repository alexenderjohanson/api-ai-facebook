'use strict';

const fetch = require('node-fetch');

const API_URL = "http://dashboard.helprnow.com/";
const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Basic aGVscHI6aGVscHJiMHQ="
}

exports.getUserByFbId = function (fbId) {

    return fetch(`${API_URL}api/v1/users.json?fbid=${fbId}`, { method: "GET", headers: HEADERS }).then(function (res) {
        
        console.log(res.Body.url);
        
        return res.json();
    }, function (error) {
        console.log(error);
    });
}

exports.createUser = function () {

    return fetch(`${API_URL}api/v1/users.json}`, { method: "POST", headers: HEADERS })
}