'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var bodyParser = require('body-parser');
// var extractUserFromBearerToken = require("../app/middlewares/extractUserFromBearerToken");

module.exports = function () {
    // Initialize express app
    const app = express();
    app.use(bodyParser.json());
    app.all('*', function (req, res, next) {
        // res.header("Access-Control-Allow-Origin", '*');
        // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, content-type, accept");
        next();
    });
    // app.use(expressValidator());
    // app.use(cors());
    // app.use(multer({
    //     dest: './uploads',
    //     limits: {
    //         fieldNameSize: 50,
    //         files: 5,
    //         fileSize: 1024 * 1024
    //     },
    //     rename: function (fieldname, filename) {
    //         return filename;
    //     },
    //     onFileUploadStart: function (file) {
    //         if (file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
    //             return false;
    //         }
    //     }
    // }).array('images'));


    // Assume 404 since no middleware responded
    app.use(function (req, res) {
        //res.status(404).render('404', {
        //    url: req.originalUrl,
        //    error: 'Not Found'
        //});
        res.status(404).json("Api not found");
    });

    return app;
};