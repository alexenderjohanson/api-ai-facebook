'use strict';

const cache = require("../cache");
const _ = require("lodash");

exports.handle = function (sender, payload) {

    let split = _.split(payload, "-");
    let action = split[0];

    //check if this postback is valid
    let shortid = split[1];
    let hasShortId = cache.popShortId(shortid);

    console.log("shortid:" + shortid);
    console.log("paylaod: " + payload);
    console.log("has shortid: " + hasShortId);

    if (!hasShortId) {
        return {
            "text": "This action is no longer valid please start a new request."
        }
    }

    let response = {};
    if (action == "confirm-order") {
        let order = orders.get(sender);
        orders.delete(sender);
        // let f = {
        //     first_name: 'Johanson',
        //     last_name: 'Chew',
        //     profile_pic: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1377497_10151773468449760_1886125195_n.jpg?oh=ce45faea2d5661b6004fc6cedf71b4a3&oe=57E64824',
        //     locale: 'en_GB',
        //     timezone: 8,
        //     gender: 'male',
        //     food: 'Roti Canai',
        //     contact: '0129813030', address: '12 dsjfskj skdjf'
        // }

        if (!order) {
            return {
                "text": "This order is expired. Please start a new order."
            }
        }

        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "receipt",
                    "recipient_name": order.first_name + order.last_name,
                    "order_number": "12345678902",
                    "currency": "MYR",
                    "payment_method": "Billplz",
                    "order_url": "http://petersapparel.parseapp.com/order?order_id=123456",
                    "timestamp": moment().seconds(),
                    "elements": [
                        {
                            "title": "Food order",
                            "subtitle": order.food,
                            "price": 50,
                            "currency": "MYR",
                        },
                    ],
                    "address": {
                        "street_1": "1 Hacker Way",
                        "street_2": "",
                        "city": "Menlo Park",
                        "postal_code": "94025",
                        "state": "CA",
                        "country": "US"
                    },
                    "summary": {
                        "subtotal": 75.00,
                        "shipping_cost": 4.95,
                        "total_tax": 6.19,
                        "total_cost": 56.14
                    },
                    "adjustments": [
                        {
                            "name": "New Customer Discount",
                            "amount": 20
                        },
                        {
                            "name": "$10 Off Coupon",
                            "amount": 10
                        }
                    ]
                }
            }
        };

    } else if (action == "service-list") {


        // let text = JSON.stringify(payload);
    } else if (action == "use-existing-address") {
        response = {
            "recur": true,
            "text": addresses.get(sender)
        }

    } else if (action == "enter-new-address") {
        response = {
            "text": "Please enter new address"
        }
    } else if (action == "hpstalkoptiona" || action == "hpstalkoptionb") {
        response = {
            "recur": true,
            "text": action
        }
    } else if (action == "cancelOrder") {
        response = {
            "recur": true,
            "text": action
        }
    }

    return response;
}
