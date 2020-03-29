var express = require('express');
var router = express.Router();

let globals = require('../globals.js');

let devices = globals.devices;

var multer          = require('multer');
var upload          = multer({dest: '/plexpass/'});

//-----------------------------------------Plex API


/**
 * @api {post} /plex/webhook PlexWebhookEndpoint
 * @apiName PlexWebhookEndpoint
 * @apiGroup VendorAPI
 * @apiVersion  0.1.0
 * @apiDescription Reacts to Plex's webhooks, and will look through activities to see if any will be triggered by this webhook
 * 
 * @apiSuccess (200) {HTTPStatus} OK-200 returns a status code of 200
 */
router.route('/plex').post(upload.single('thumb'), (req, res, next) => {
    var payload = JSON.parse(req.body.payload);
    //console.log(payload);

    activities.filter((eachActivity) => {
        return (eachActivity.triggers.plex !== undefined && eachActivity.on);
    }).map((plexActivity) => {
        var triggerSpecs = plexActivity.triggers.plex;
        var eventMatch = triggerSpecs.event === undefined || triggerSpecs.event.includes(payload.event);
        var accountMatch = triggerSpecs.account === undefined || triggerSpecs.account.includes(payload.Account.title.toLowerCase());
        var playerMatch = triggerSpecs.player === undefined || triggerSpecs.player.includes(payload.Player.uuid);
        if (eventMatch && accountMatch && playerMatch) {
            device_tools.runActivity(modules, activities, devices, plexActivity.name);
        }
    });

    res.sendStatus(200);
});


/**
 * @api {get} /oauth2/google RecieveGoogleAuth
 * @apiDescription The OAuth2 endpoint of the server so you can log in
 * @apiName RecieveGoogleAuth
 * @apiGroup VendorAPI
 * @apiVersion 0.1.0
 * @apiParam (query) {string} code the token code returned from Google
 * @apiParam (query) {scope} scope the scope of the access to Google functions
 * 
 * @apiSuccess (200) {Status} OK-200 returns a status code of 200
 */
router.route('/google/oauth2').get((req, res) => {
    var token_code = req.query.code;
    var scope_oauth = req.query.scope;
    //res.send(google_tools.saveAccessToken(google_oauth, token_code));
    res.send(200);
    console.log(google_tools.saveAccessToken(modules.google.google_oauth, token_code));
});

module.exports = router;