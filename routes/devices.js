var express = require('express');
var router = express.Router();

let globals = require('../globals.js');

let devices = globals.devices;


/**
 * Converts the device list in memory to HTTP sendable devices
 * @function getSendableDevices
 * @returns {JSON} the device list in a sendable format
 */
function getSendableDevices() {
    devices = globals.getDevices();
    var dev_list = devices.map((d) => { 
        return d.getSendableDevice()
    }).filter((d) => {
        if (d !== undefined) return d;
    });
//might need to change front end here for differences in sendable devices now
    //     if (d.deviceProto === 'harmony') {
    //         sendableDevice.harmony = d.controlGroups;
    //         sendableDevice.harmonyControls = true;
    //     }
    //     return sendableDevice;
    // });
    return dev_list.sort(function(a, b) {return a.deviceID - b.deviceID});
}

//----------------------------------------------Device API
/**
 * @apiDefine authToken
 * @apiParam (query) {string} authToken the authentication token of the server, sent as query
 * @apiParamSample
 * @apiError InvalidAuthToken HTTP/HTTPS request did not contain a valid authToken
 * @apiErrorExample Response (example):
 *      HTTP/2.0 401 Authentication Invalid
 *      {
 *          "error": "InvalidAuthToken"
 *      }
 */

/**
 * @apiDefine deviceNotExist
 * @apiError DeviceNotExist requested device does not exist
 * @apiErrorExample {json} Response (example):
 *      HTTP/2.0 404 Not Found
 *      {
 *          "error": "DeviceNotExist"
 *      }
 */

/**
 * @apiDefine deviceNotResponsive
 * @apiError DeviceNotResponsive operation was not able to process the device
 * @apiErrorExample {json} Response (example):
 *      HTTP/2.0 500 DeviceUnavailable
 *      {
 *          "error": "DeviceNotResponsive"
 *      }
  */

/**
 * @api {get} /api/devices/list ListDevices
 * @apiDescription Lists all the currently known/controllable devices
 * @apiName ListDevices
 * @apiGroup Devices
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Device[]} devices the full list of devices from the server
 * 
 * @apiUse authToken
 */
router.route('/list').get((req, res) => {    
    var dev_list = getSendableDevices();
    res.json(dev_list);
});

router.route('/rooms').get((req, res) => {
    let rooms = [];
    var dev_list = getSendableDevices();
    dev_list.forEach( (dev) => {
        rooms[dev.roomID].devices.push(dev);
        rooms[dev.roomID].name = dev.roomName;
    });
    res.json(rooms);
});


/**
 * @api {get} /api/devices/:deviceID/info GetDeviceInfo
 * @apiDescription Gets info about the specific device
 * @apiName GetDeviceInfo
 * @apiGroup Devices
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Device} device returns the requested device information from the server
 * @apiUse deviceNotExist
 * @apiUse authToken
 */
router.route('/:deviceID/info').get(async (req, res) => {

    var index = parseInt(req.params.deviceID);
    let d = devices[index];
    if (d === undefined) {
        res.status(404).json({error: 'DeviceNotExist'});
        return;
    }
    res.json(d.getSendableDevice());
});


/**
 * @api {get} /api/devices/:deviceID/set/:state SetDeviceState
 * @apiDescription Sets the state of an individual device 
 * @apiName SetDeviceState
 * @apiGroup Devices
 * @apiVersion 0.1.0
 * 
 * @apiParam (path) {number} deviceID the ID of the device
 * @apiParam (path) {number} state the state the device with id deviceID should be set to, this should be 0 or 1
 * 
 * @apiSuccess (200) {Device} device returns the updated Device object
 * @apiUse deviceNotExist
 * @apiUse deviceNotResponsive
 * @apiUse authToken
 */
router.route('/:deviceID/set/:state').get( async (req, res) => {

    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device === undefined) {
        res.status(404).json({error: 'DeviceNotExist'});
        return;
    }
    var state = req.params.state === '1' ? true : (req.params.state === '0' ? false : undefined);
    device = await device.setState(state);
    if (device === undefined) {
        res.status(500).json({error: 'DeviceNotResponsive'});
        return;
    }
    res.json(device);
});


module.exports = router;