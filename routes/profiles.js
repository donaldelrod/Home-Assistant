var express = require('express');
var router = express.Router();

let globals = require('../globals.js');

let profiles = globals.profiles;


//-----------------------------------------Profiles API

/**
 * @api {get} /api/profiles/list ListProfiles
 * @apiDescription Returns the loaded profiles from the server
 * @apiName ListProfiles
 * @apiGroup Profiles
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Profile[]} profiles the full list of profiles from the server
 * @apiUse authToken
 */
router.route('/list').get( (req, res) => {
    profiles = globals.getProfiles();
    res.json(profiles);
});

module.exports = router;