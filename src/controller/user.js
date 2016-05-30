'use strict';

const rp = require('request-promise');
const config = require('../config/config');

exports.getUserByFbId = function (fbId) {

    let options = {
        uri: `${config.API_URL}api/v1/users.json?fbid=${fbId}`,
        headers: config.HEADERS,
        json: true
    }

    return rp(options).then(function (res) {
        return res;
    }).catch(function (err) {
        console.log(err);
    });
}

exports.createUser = function (senderId, fbUser) {

    //     { first_name: 'Johanson',
    //     last_name: 'Chew',
    //     profile_pic: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1377497_10151773468449760_1886125195_n.jpg?oh=ce45faea2d5661b6004fc6cedf71b4a3&oe=57E64824',
    //     locale: 'en_GB',
    //     timezone: 8,
    //     gender: 'male' }

    //     {
    //     "id": 27,
    //     "email": "eujean@gmail.com",
    //     "uid": "10156266991150597",
    //     "name": "Eujean Lee",
    //     "phone": "+60123456789"
    //   }

    let user = {
        "uid": senderId,
        "name": `${fbUser.first_name} ${fbUser.last_name}`,
        "gender": fbUser.gender,
        "email": `${senderId}@test.com`
    }

    let options = {
        uri: `${config.API_URL}api/v1/users.json}`,
        headers: config.HEADERS,
        method: 'POST',
        json: true,
        body: user
    }

    return rp(options).then(function (result) {
        return result;
    }).catch(function (err) {
        console.log(err);
    });
}

exports.updateUser = function (user) {

    let options = {
        method: 'PUT',
        uri: `${config.API_URL}api/v1/users/${user.id}.json`,
        body: user,
        json: true,
        headers: config.HEADERS
    };

    console.log(options);
    return rp(options).then(function (result) {
        return result;

        // console.log(result.url);
        // console.log(result.ok);
        // console.log(result.status);
        // console.log(result.statusText);
        // console.log(result.headers.raw());

        // return result.json();

        // let json = result.json();
        // console.log("update user result:" + JSON.stringify(json));
        // return json;
    }).catch(function (err) {
        console.log(err);
    });
}
