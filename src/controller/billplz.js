'use strict';

const fetch = require('node-fetch');
const FormData = require('form-data');
const qs = require('qs');


const BILLPLZ_URL = `https://www.billplz.com/`;

exports.generatePaymentLink = function (collectionId, name, email, contact, amount, desc) {

    let query = {
        collection_id: collectionId,
        email: email,
        mobile: contact,
        name: name,
        amount: amount,
        callback_url: "https://www.google.com",
        description: desc
    }

    let headers = {
        Authorization: "Basic MGUxMjI5NWEtZGYyMi00MjQ3LTgyMWUtNzRlNjU5OTczNmQyOg=="
    }

    let queryString = qs.stringify(query);

    let url = `${BILLPLZ_URL}api/v3/bills?${queryString}`;

    fetch(url, { method: 'POST', headers: headers })
        .then(function (res) {
            return res.json();
        }, function (ex) {
            console.log(ex);
        });
}