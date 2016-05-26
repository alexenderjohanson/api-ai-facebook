
'use strict';
/**
 * Module dependencies.
 */

var fb = require('../controller/facebook/core');

module.exports = function (app) {
  app.route('/reply/:fbId')
    .post(fb.apiSendFBMessageText);

//   app.route('/suggest/:term')
//     .get(suggest.apiSuggest);

//   app.route('/product/:id')
//     .get(extractUserFromBearerToken(), product.apiGetById);
    
//   app.route('/products')
//     .post(product.apiGetByIds);
};