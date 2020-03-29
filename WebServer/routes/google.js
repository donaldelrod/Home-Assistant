var express = require('express');
var router = express.Router();

let globals = require('../globals.js');

//-------------------------------Google API

/**
 * @api {get} /api/modules/google/cal/upcoming GetUpcomingGCalEvents
 * @apiDescription Gets upcoming events in your Google Calendar
 * @apiName GetUpcomingGCalEvents
 * @apiGroup Google
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object[]} events returns an array of upcoming events
 * @apiUse authToken
 */
router.route('/cal/upcoming').get((req, res) => {

    //google_tools.getGCalEvents(google_oauth, 15).then(function (events) {
    google_tools.getGCalEvents(modules.google.google_oauth, 15).then(function (events) {
        res.json(events);
    }).catch(function (reason) {
        res.send(reason);
    });
});

//doesn't really do anything but I'm leaving it here to remind me to fix it
/**
 * @api {get} /api/modules/google/gmail/labels GetGmailLabels
 * @apiDescription Gets labels from recent emails in the linked Gmail account
 * @apiName GetGmailLabels
 * @apiGroup Google
 * @apiVersion 0.0.1
 * 
 * @apiSuccess (200) {Object[]} labels returns an array of email labels
 * @apiUse authToken
 */
router.route('/gmail/labels').get((req, res) => {

    //google_tools.getGmailLabels(google_oauth);
    google_tools.getGmailLabels(modules.google.google_oauth);
    res.sendStatus(200);
});

//doesn't really work right now
/**
 * @api {get} /api/modules/google/gmail/emails GetRecentGmails
 * @apiDescription Gets recent emails from the linked Gmail inbox
 * @apiName GetRecentGmails
 * @apiGroup Google
 * @apiVersion 0.0.1
 * 
 * @apiSuccess (200) {Object[]} gmails returns an array of recent gmails
 * @apiUse authToken
 */
router.route('/gmail/emails').get(async (req, res) => {

    //google_tools.getGmailLabels(google_oauth);
    var emails = await google_tools.getRecentEmails(modules.google.google_oauth);
    res.send(200, emails);
});


module.exports = router;