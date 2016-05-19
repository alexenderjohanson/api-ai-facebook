
'use strict';
/**
 * Module dependencies.
 */

var fb = require('../controllers/facebook/core');

module.exports = function (app) {
  app.route('/reply/:userId')
    .get(fb.sendFBMessageText);

//   app.route('/suggest/:term')
//     .get(suggest.apiSuggest);

//   app.route('/product/:id')
//     .get(extractUserFromBearerToken(), product.apiGetById);
    
//   app.route('/products')
//     .post(product.apiGetByIds);
};