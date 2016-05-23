'use strict';

const fetch = require('node-fetch');

const API_URL = "http://dashboard.helprnow.com/";
const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Basic aGVscHI6aGVscHJiMHQ="
}

exports.getUserByFbId = function (fbId) {

    return fetch(`${API_URL}api/v1/users.json?fbid=${fbId}`, { method: "GET", headers: HEADERS }).then(function (res) {

        return res.json();
    }, function (error) {
        console.log(error);
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
        "email": `${fbUser.first_name}@test.com`
    }

    return fetch(`${API_URL}api/v1/users.json}`, { method: 'POST', body: user, headers: HEADERS }).then(function (result) {
        return result.json();
    }, function (error) {
        console.log(error);
    });
}

exports.updateUser = function (user) {

    let options = {
        method: 'POST',
        body: user,
        headers: HEADERS
    }
    
    console.log(options);
    return fetch(`${API_URL}api/v1/users/${user.id}.json`, options).then(function (result) {
        // console.log(result);

        console.log(result.url);
        console.log(result.ok);
        console.log(result.status);
        console.log(result.statusText);
        console.log(result.headers.raw());
        
        return result.json();

        // let json = result.json();
        // console.log("update user result:" + JSON.stringify(json));
        // return json;
    }).then(function(text){
        
        console.log(text);
        
    }, function (error) {
        console.log(error);
    });
}