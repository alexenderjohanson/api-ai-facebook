'use strict';

const fetch = require('node-fetch');
const FormData = require('form-data');
const qs = require('qs');


const BILLPLZ_URL = `https://www.billplz.com/`;

exports.generatePaymentLink = function (collectionId, name, email, contact, amount, desc) {

    try {
        let query = {
            collection_id: collectionId,
            email: email,
            mobile: contact,
            name: name,
            amount: amount,
            callback_url: "http://dashboard.helprnow.com/orders",
            description: desc
        }

        let headers = {
            Authorization: "Basic MGUxMjI5NWEtZGYyMi00MjQ3LTgyMWUtNzRlNjU5OTczNmQyOg=="
        }

        let queryString = qs.stringify(query);

        let url = `${BILLPLZ_URL}api/v3/bills?${queryString}`;
        
        console.log(url);

        return fetch(url, { method: 'POST', headers: headers })
            .then(function (res) {
                return res.json();
            }, function (ex) {
                console.log(ex);
            });

    } catch (ex) {
        console.log(ex);
    }
}