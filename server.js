/**
 * @fileoverview Main file for the program, server.js initiates all program logic and contains all api endpoints
 * @author Donald Elrod
 * @version 1.0.0
 * @requires os
 * @requires fs
 * @requires http
 * @requires https
 * @requires express
 * @requires multer
 * @requires node-schedule
 * @requires cors
 * @requires file_tools.js
 * @requires Devices/Device.js
 */

'use strict';
//-------------NPM modules and Variables------------------------//
//var tsr             = require('typescript-require');
var os              = require('os');
var fs              = require('fs');
var http            = require('http');
var https           = require('https');
var express         = require('express');
var app             = express();
var httpsoptions         =   {  
                            key: fs.readFileSync('./https_key.pem', 'utf8'),  
                            cert: fs.readFileSync('./https_cert.crt', 'utf8')  
                        };
var schedule        = require('node-schedule');
//var cors            = require('cors');
//let hb              = require('homebridge');
let hbs             = require('./Modules/HomeBridge')();//(hb);
var platform = process.platform;


//-------------personal modules--------------------------------//
var file_tools      = require('./file_tools.js');
var device_tools    = require('./device_tools.js');
var prox_tools      = require('./prox_tools.js');
var google_tools    = require('./google_tools.js');
var activity_tools  = require('./activity_tools.js');
var netgear_tools   = require('./netgear_tools.js');

const Device        = require('./Devices/Device.js');

//-------------Program Variables------------------------------//
const programPath   = __dirname;
var modulesPath     = './config/modules.json';
var devicesPath     = './config/devices.json'; 
var activitiesPath  = './config/activities.json';
var profilesPath    = './config/profiles.json';
var configPath      = './config/config.json';

let globals         = require('./globals.js');

let devices         = globals.devices;//[];
let profiles        = globals.profiles;//[];
let activities      = globals.activities;//[];
let config          = globals.config;//{};
let modules         = globals.modules;//{};
let scheduledFunctions = globals.scheduledFunctions;//[];
let DeviceModules   = globals.DeviceModules;
let PluginModules   = globals.PluginModules;

/**
 * Processes all activities that can be run by the program, and schedules programs with timing triggers
 * @function processActivities
 */
function processActivities() {
    //this schedules activities that happen at a particular time
    var activitiesToSchedule = activities.filter((eachActivity) => {
        return (eachActivity.triggers.timeofday !== undefined && eachActivity.on);
    });
    if (activitiesToSchedule.length > 0) {
        activitiesToSchedule.map((scheduledActivity) => {
            var cronStr = scheduledActivity.triggers.timeofday;
            var j = schedule.scheduleJob(cronStr, function(fireTime) {
                device_tools.runActivity(modules, activities, devices, scheduledActivity.name);
                console.log(scheduledActivity.name + ' ran at ' + fireTime);
            });
            j.jobname = scheduledActivity.name;
            scheduledFunctions.push(j);
        });
    }
    console.log('Scheduled ' + scheduledFunctions.length + ' activities, loaded a total of ' + activities.length + ' activities');
}

/**
 * Processes all known devices that will be controlled by the program
 * @async
 * @function processDevices
 * @param {Array<Object>} deviceList list of devices loaded from file
 */
async function processDevices(deviceConfig) {
    console.log('Connecting to devices...');

    // here I load the device modules so that we can abstract away all of the implementation 
    // differences of different devices, as well as dynamically load device modules
    await deviceConfig.deviceModules.forEach(async function(deviceModule) {
        DeviceModules[deviceModule.deviceType] = require(deviceModule.file);
        if (DeviceModules[deviceModule.deviceType].setupPlugin !== undefined)
            DeviceModules[deviceModule.deviceType].setupPlugin(deviceModule.details, devices);
    });

    // reserve spots for the devices loaded in the devices.json file
    devices.length = deviceConfig.deviceList.length;

    // create the proper Device subclass for the devices saved in devices.json
    await deviceConfig.deviceList.forEach(async function(device) {
        var tempDevice;
        try {
            // create the base Device object
            tempDevice = new Device(
                device.deviceID,
                device.name,
                device.deviceType,
                device.deviceKind,
                device.deviceProto,
                device.groups,
                false,
                device.isToggle,
                'off',
                device.ip,
                device.roomID,
                device.roomName
            );
            
            // here any additional details for device setup are added to the Device object
            //tempDevice.details = device.details;

            // this creates an instantiation of a device module
            let dev = DeviceModules[device.deviceProto];
            tempDevice = new dev(tempDevice, device.details);
            // call the setup function for the device: passing the devices array so controllers can add their devices
            await tempDevice.setup(devices);
            // inserts the device into the reserved spot in the devices array
            devices[device.deviceID] = tempDevice;
            console.log(tempDevice.deviceKind + ' ' + tempDevice.name + ' conected successfully');
        } catch (err) {
            console.log(err);
        }
    });
}

/**
 * Processes all modules that will be used by the program
 * @async
 * @function processModules
 * @param {Array<Object>} moduleList list of modules loaded from file
 */
async function processModules(moduleList) {
    console.log('Connecting to modules...');
    await moduleList.forEach(async function(type) {
        if (type.moduleName === 'proxmox') //deal with proxmox setup
            prox_tools.processProxmox(modules, type);          
        else if (type.moduleName === 'google') //deal with google account setup
            google_tools.processGoogleAccount(modules, type);
        else if (type.moduleName === 'netgear') //deal with netger router setup
            netgear_tools.processNetgearRouter(modules, type);
        else if (type.moduleName === 'opencv' && platform === 'linux') { //deal with opencv module, which will only be supported on linux/raspberry pi (for now at least)
            //modules.cv = require('opencv4nodejs');
            //modules.cv.webcam = new modules.cv.VideoCapture(parseInt(type.details.devicePort));
        }
    });
}

/**
 * Polls every device in devices that has the property 'pollable' for their state
 * Function is meant to be scheduled and run repeaedly
 * @function pollDevices
 */
function pollDevices() {
    console.log('polling devices');
    devices.forEach( (eachDevice) => {
        if (eachDevice.pollable) {
            var state = eachDevice.getDeviceState();
            Promise.resolve(state).then((currentState) => {
                eachDevice.lastState = currentState;
            }).catch(err => console.log(err));
        }
    });
    globals.setDevices(devices);
}

/**
 * Queries the Netgear Router for the list of attached devices, and then checks the attached devices to see if they belong to anyone in the profiles list.
 * Profiles are updated with their owned devices, as well as a strength property that indicates the likelyhood they are at home
 * @async
 * @function checkWhoIsHome
 */
async function checkWhoIsHome() {
    if (modules.netgearRouter.unavailable)
        return;
    var attachedDevices = await netgear_tools.getAttachedDevices(modules);
    if (attachedDevices === null)
        return;
    
    console.log('checking who is home');
    profiles.forEach(function(profile) {
        var profileDevices = attachedDevices.filter((attd) => {
            //filters if one of the devices is in the person's identifiers
            return profile.identifiers.ip.includes(attd.IP)
        });
        profile.strength = profileDevices.length;
        profile.devices = profileDevices;
    });
}

/**
 * Runs the setup function, which loads all config and saved device/profile/module/activity data, and processes them in their respective functions
 * @async
 * @function setup
 */
async function setup() {
    config          = await file_tools.readJSONFile(configPath);
    profiles        = await file_tools.readJSONFile(profilesPath);
    modules.list    = await file_tools.readJSONFile(modulesPath);
    activities      = await file_tools.readJSONFile(activitiesPath);
    let deviceList  = await file_tools.readJSONFile(devicesPath);
    //var deviceList  = deviceConfig.deviceList;
    //globals.setConfig(config);
    globals.setProfiles(profiles);

    await processDevices({
        deviceModules: config.deviceModules, 
        deviceList: deviceList
    });
    
    await processModules(modules.list);
    await activity_tools.processActivities(activities, scheduledFunctions, schedule);
    //processActivities();

    console.log('Home Assistant will be polling for device states every ' + parseInt(config.devicePollInterval)/60000 + ' minutes');
    console.log('Home Assistant will be checking who is home every ' + parseInt(config.whoIsHomeInterval)/60000 + ' minutes');

    pollDevices();
    //schedules the function pollDevices() to execute at intervals specified in the config file
    setInterval(pollDevices, parseInt(config.devicePollInterval)); 

    checkWhoIsHome();
    //schedules the function checkWhoIsHome() to execute at intervals specified in the config file
    setInterval(checkWhoIsHome, parseInt(config.whoIsHomeInterval));

}

setup();

//some cleaning on exit from the program
process.on('beforeExit', function(code) {
    console.log('exit code: ' + code);
    modules.harmony.hubs.map((hub) => hub.end());
    modules.netgearRouter.logout();

    // var writableDevices = device_tools.getWritableDevices(devices);
    // var writableProfiles = device_tools.getWritableProfiles(profiles);
    // var writableActivities = device_tools.getWritableActivities(activities);
    // file_tools.writeJSONFile(devicesPath, writableDevices, function() {console.log('saved devices')});
    // file_tools.writeJSONFile(profilesPath, writableProfiles, function() {console.log('saved profiles')});
    // file_tools.writeJSONFile(activitiesPath, writableActivities, function() {console.log('saved activities')});
    // file_tools.writeJSONFile(modulesPath, modules, function() {console.log('saved modules')});

    console.log('safely exiting the program');
});

//app.use(cors());

//adds cors functionality
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/**
 * Express middleware that checks if the given API request has the needed credientals
 * @function checkRequest
 */
app.use('/api', function (req, res, next) {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else
    
    // if the requested page is root or if the authToken is correct
    if (req.query.authToken !== config.authToken) {
        res.status(401).json({error: 'InvalidAuthToken'});
        return false;
    }
    next();    
});

// lets the documentation pages be served
app.use('/', express.static('compiled/ng'));
app.use('/docs/server', express.static('compiled/docs/server'));
app.use('/docs/api', express.static('compiled/docs/api'));

var nonsecureServer = http.createServer(app).listen(9875);
var secureServer = https.createServer(httpsoptions, app).listen(9876);


app.use('/api/devices', require('./routes/devices.js'));
app.use('/api/profiles', require('./routes/profiles.js'));
app.use('/api/webhooks', require('./routes/webhooks.js'));
app.use('/api/metrics', require('./routes/metrics.js'));
app.use('/api/opencv', require('./routes/opencv.js'));
app.use('/api/proxmox', require('./routes/proxmox.js'));
app.use('/api/harmony', require('./routes/harmony.js'));
app.use('/api/google', require('./routes/google.js'));
app.use('/api/netgear', require('./routes/netgear.js'));

//-------------------------------------------------------API Endpoints from here on

//-----------------------------------------Group API


/**
 * @api {get} /api/groups/:control GroupControl
 * @apiDescription Controls the state of a group of devices
 * @apiName GroupControl
 * @apiGroup Groups
 * @apiVersion 0.1.0
 * 
 * @apiParam (path) {number} control the control operation for the group
 * @apiParam (query) {string[]} groups the groups to be controlled
 * 
 * @apiSuccess (200) {string} status whether the control was successfully executed
 * @apiUse authToken
 */
app.route('/api/groups/:control').get((req, res) => {

    var groups = req.query.groups;
    var control = parseInt(req.params.control);
    var controlGroup = [];

    devices.forEach(function(device) {              //for each device loaded in program
        var isInGroup = true;                       //whether or not the device is in the specified group
        groups.forEach(function(g) {                //for each group in the request
            if (isInGroup && device.groups.indexOf(g) == -1)   //if the group from the request is not in the devices groups
                isInGroup = false;
        });
        if (isInGroup)                              //if it is, push it to controlGroup
            controlGroup.push(device);
    })

    switch (control) {
        case 0: //turn off group
            controlGroup.forEach(function(device) {
                device_tools.setDeviceState(device, false, modules);
            });
            break;
        case 1: //turn on group
            controlGroup.forEach(function(device) {
                device_tools.setDeviceState(device, true, modules);
            });
            break;
        case 2: //toggle group
            controlGroup.forEach(function(device) {
                device_tools.setDeviceState(device, undefined, modules);
            });
            break;
        default:
            res.send('no control implemented for ', control);
    }
    res.send('success');
});

//-----------------------------------Activity API


/**
 * @api {get} /api/activities/name/:name RunActivity
 * @apiDescription Runs the activity with the name :name
 * @apiName RunActivity
 * @apiGroup Activities
 * @apiVersion 0.1.0
 * 
 * @apiParam (path) {string} name the name of the activity
 * 
 * @apiSuccess (200) {string} status whether the activity was run successfully
 * @apiUse authToken
 */
app.route('/api/activities/name/:name').get((req, res) => {

    device_tools.runActivity(modules, activities, devices, req.params.name).then((success) => {
        res.status(success ? 200 : 503).send( (success ? 'successfully ran ' : 'failed to run ') + 'activity ' + req.params.name);
    });
});


/**
 * @api {get} /api/activities/scheduled GetScheduledActivities
 * @apiDescription Return all scheduled activities
 * @apiName GetScheduledActivities
 * @apiGroup Activities
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} scheduledActivities returns the name of the activities that are scheduled
 * @apiUse authToken
 */
app.route('/api/activities/scheduled').get((req, res) => {

    var sch = scheduledFunctions.map((eachFunction) => {
        return eachFunction.jobname;
    });
    res.json(sch);
});

//----------------------------------------------------Debug API

/**
 * @api {get} /debug/testAuthToken TestAuthToken
 * @apiName TestAuthToken
 * @apiGroup Debugging
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {string} response 'AuthTokenValid' 
 * @apiSuccessExample {string} Success-Response:
 * {
 *     "success" : "AuthTokenValid"
 * }
 * 
 * @apiUse authToken
 */
app.route('/debug/testAuthToken').get( (req, res) => {
    //if (!checkRequest(req, res)) return;

    res.status(200).json({success: "AuthTokenValid"});
});