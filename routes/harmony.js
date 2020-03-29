var express = require('express');
var router = express.Router();

let globals = require('../globals.js');

//---------------------------Harmony API


/**
 * @api {get} /api/modules/harmony/control/:device_name/:control_group/:control ControlHarmonyDevice
 * @apiName ControlHarmonyDevice
 * @apiGroup Harmony
 * @apiVersion  0.1.0
 * @apiDescription Control a specific Harmony controlled device by specifying a device name, control group and control
 * 
 * @apiParam (path) {string} device_name the name of the Harmony device
 * @apiParam (path) {string} control_group the control group that the control belongs to
 * @apiParam (path) {string} control the control to execute
 * 
 * @apiSuccess (200) {HTTPStatus} OK-200 returns a status code of 200
 * @apiError NoHarmonyControl the given control or device could not be found
 * @apiErrorExample {json} Response (example):
 *      HTTP/2.0 503 Service Unavailable
 *      {
 *          "error": "Harmony control could not be found"
 *      }
 * @apiUse authToken
 */
router.route('/harmony/control/:device_name/:control_group/:control').get((req, res) => {

    var selectedControl = device_tools.getHarmonyControl(modules, req.params.device_name, req.params.control_group, req.params.control);

    if (selectedControl !== undefined) {
        harmony_tools.sendHarmonyCommand(modules, selectedControl.formattedCommand);
        res.sendStatus(200);
    } else {
        console.log('Harmony control not found: ' + req.params.control_group + ' ' + req.params.control);
        res.status(503).json({error:'Harmony control could not be found...'});
    }
});



module.exports = router;