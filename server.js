/**
 * @fileoverview Main file for the program, server.js initiates all program logic and contains all api endpoints
 * @author Donald Elrod
 * @version 1.0.0
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
var multer          = require('multer');
var upload          = multer({dest: '/plexpass/'});
var schedule        = require('node-schedule');
var cors            = require('cors');

var platform = process.platform;


//-------------personal modules--------------------------------//
var file_tools      = require('./file_tools.js');
var device_tools    = require('./device_tools.js');
var prox_tools      = require('./prox_tools.js');
var google_tools    = require('./google_tools.js');
var hue_tools       = require('./hue_tools.js');
var activity_tools  = require('./activity_tools.js');
var netgear_tools   = require('./netgear_tools.js');
var harmony_tools   = require('./harmony_tools.js');

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
                device.ip
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
        else if (type.moduleName === 'harmony') //deal with harmony hub setup
            harmony_tools.processHarmonyHubs(modules, devices, type);
        // else if (type.moduleName === 'hue') { //deal with hue bridge setup
        //     //hue_tools.processHue(modules, devices, type);
            
        // }
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
}

/**
 * Converts the device list in memory to HTTP sendable devices
 * @function getSendableDevices
 * @returns {JSON} the device list in a sendable format
 */
function getSendableDevices() {
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

/**
 * Queries the Netgear Router for the list of attached devices, and then checks the attached devices to see if they belong to anyone in the profiles list.
 * Profiles are updated with their owned devices, as well as a strength property that indicates the likelyhood they are at home
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
 * @function setup
 */
async function setup() {
    config          = await file_tools.readJSONFile(configPath);
    profiles        = await file_tools.readJSONFile(profilesPath);
    modules.list    = await file_tools.readJSONFile(modulesPath);
    activities      = await file_tools.readJSONFile(activitiesPath);
    let deviceList = await file_tools.readJSONFile(devicesPath);
    //var deviceList  = deviceConfig.deviceList;

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

    //checkWhoIsHome();
    //schedules the function checkWhoIsHome() to execute at intervals specified in the config file
    //setInterval(checkWhoIsHome, parseInt(config.whoIsHomeInterval));

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

app.use(cors());

//adds cors functionality
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//lets the documentation pages be served
app.use('/', express.static('compiled/ng'));
app.use('/docs/server', express.static('docs/server'));
app.use('/docs/api', express.static('docs/api'));

var nonsecureServer = http.createServer(app).listen(9875);
var secureServer = https.createServer(httpsoptions, app).listen(9876);

/**
 * Checks if the given request has the needed credientals
 * @function checkRequest
 */
function checkRequest(req, res) {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).json({error: 'InvalidAuthToken'});
        return false;
    }
    return true;
}

//-------------------------------------------------------API Endpoints from here on

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
app.route('/api/devices/list').get((req, res) => {    
    if (!checkRequest(req, res)) return;

    var dev_list = getSendableDevices();
    //console.log(dev_list);
    res.json(dev_list);
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
app.route('/api/devices/:deviceID/info').get(async (req, res) => {
    if (!checkRequest(req, res)) return;

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
app.route('/api/devices/:deviceID/set/:state').get( async (req, res) => {
    if (!checkRequest(req, res)) return;

    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device === undefined) {
        res.status(404).json({error: 'DeviceNotExist'});
        return;
    }
    var state = req.params.state === '1' ? true : (req.params.state === '0' ? false : undefined);
    device = await device.setState(state);
    //let d = await device_tools.setDeviceState(device, state, modules);
    if (device === undefined) {
        res.status(500).json({error: 'DeviceNotResponsive'});
        return;
    }
    res.json(device);
});

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
app.route('/api/profiles/list').get( (req, res) => {
    if (!checkRequest(req, res)) return;

    res.json(profiles);
});

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
    if (!checkRequest(req, res)) return;

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
    if (!checkRequest(req, res)) return;

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
    if (!checkRequest(req, res)) return;

    var sch = scheduledFunctions.map((eachFunction) => {
        return eachFunction.jobname;
    });
    res.json(sch);
});

//-------------------------------Stats and Performance API

/**
 * @api {get} /api/metrics/me/cpu GetServerCPUMetrics
 * @apiDescription Returns the computer running the server's CPU metrics
 * @apiName GetServerCPUMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} CPUMetrics returns the metrics of each cpu core of the server
 * @apiUse authToken
 */
app.route('/api/metrics/me/cpu').get((req, res) => {
    if (!checkRequest(req, res)) return;

    res.json(os.cpus());
});

/**
 * @api {get} /api/metrics/me/mem GetServerMemMetrics
 * @apiDescription Returns the computer running the server's memory metrics
 * @apiName GetServerMemMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} MemMetrics returns the metrics of the server's memory
 * @apiUse authToken
 */
app.route('/api/metrics/me/mem').get((req, res) => {
    if (!checkRequest(req, res)) return;
    var tmem = os.totalmem();
    var fmem = os.freemem();
    var umem = tmem - fmem;
    var mem = {
        totalmem: tmem,
        freemem: fmem,
        usedmem: umem
    }
    res.json(mem);
});

/**
 * @api {get} /api/metrics/me/load GetServerCPULoadMetrics
 * @apiDescription Returns the computer running the server's CPU load metrics
 * @apiName GetServerCPULoadMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} CPULoadMetrics returns the metrics of the avaerage load of the server
 * @apiUse authToken
 */
app.route('/api/metrics/me/load').get((req, res) => {
    if (!checkRequest(req, res)) return;

    res.json({load: os.loadavg()});
});

/**
 * @api {get} /api/metrics/me/network GetServerNetworkInterfaces
 * @apiDescription Returns the computer running the server's network interfaces
 * @apiName GetServerNetworkInterfaces
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} NetworkInterfaces returns the network interfaces of the server
 * @apiUse authToken
 */
app.route('/api/metrics/me/network').get((req, res) => {
    if (!checkRequest(req, res)) return;

    res.json(os.networkInterfaces());
});

/**
 * @api {get} /api/metrics/me/all GetAllServerMetrics
 * @apiDescription Returns the full spectrum of metrics about the computer running the server
 * @apiName GetAllServerMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} AllMetrics returns all available metrics about the computer running the server
 * @apiUse authToken
 */
app.route('/api/metrics/me/all').get((req, res) => {
    if (!checkRequest(req, res)) return;

    var tmem = os.totalmem();
    var fmem = os.freemem();
    var umem = tmem - fmem;
    var mem = {
        totalmem: tmem,
        freemem: fmem,
        usedmem: umem
    }

    var cpus        = os.cpus();
    var ni          = os.networkInterfaces();
    var load        = os.loadavg();
    var end         = os.endianness();
    var platform    = os.platform();
    var arch        = os.arch();
    var uptime      = os.uptime();

    var stats = {
        platform: platform,
        arch: arch,
        endianness: end,
        cpus: cpus,
        memory: mem,
        networkInterfaces: ni,
        loadavg: load,
        uptime: uptime
    }

    res.json(stats);
});

//-------------------------------Google API

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
app.route('/oauth2/google').get((req, res) => {
    var token_code = req.query.code;
    var scope_oauth = req.query.scope;
    //res.send(google_tools.saveAccessToken(google_oauth, token_code));
    res.send(200);
    console.log(google_tools.saveAccessToken(modules.google.google_oauth, token_code));
});

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
app.route('/api/modules/google/cal/upcoming').get((req, res) => {
    if (!checkRequest(req, res)) return;

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
app.route('/api/modules/google/gmail/labels').get((req, res) => {
    if (!checkRequest(req, res)) return;

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
app.route('/api/modules/google/gmail/emails').get(async (req, res) => {
    if (!checkRequest(req, res)) return;

    //google_tools.getGmailLabels(google_oauth);
    var emails = await google_tools.getRecentEmails(modules.google.google_oauth);
    res.send(200, emails);
});

//------------------------------------Netgear API

/**
 * @api {get} /api/netgearrouter/attached GetNetgearAttachedDevices
 * @apiDescription Returns all the devices connected to the Linked Netgear router
 * @apiName GetNetgearAttachedDevices
 * @apiGroup Netgear
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object[]} attachedDevices returns an array of attached devices
 * @apiUse authToken
 */
app.route('/api/netgearrouter/attached').get(async (req, res) => {
    if (!checkRequest(req, res)) return;

    var attachedDevices = await netgear_tools.getAttachedDevices(modules);
    res.send(attachedDevices);
});

/**
 * @api {get} /api/netgearrouter/info GetNetgearAttributes
 * @apiDescription Returns info about the Netgear router
 * @apiName GetNetgearAttributes
 * @apiGroup Netgear
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object[]} netgearInfo returns object with Netgear router attributes
 * @apiUse authToken
 */
app.route('/api/netgearrouter/info').get((req, res) => {
    if (!checkRequest(req, res)) return;

    modules.netgearRouter.login(modules.netgearRouter.storedPass, modules.netgearRouter.storedUser, modules.netgearRouter.storedHost, modules.netgearRouter.storedPort).then(function(successfulLogin) {
        if (successfulLogin) {
            modules.netgearRouter.getInfo().then(function(info) {
                res.send(info);
            });
        }
    });
});

//---------------------------Harmony API

/**
 * @api {get} /api/modules/harmony/devices GetHarmonyDevices
 * @apiName GetHarmonyDevices
 * @apiGroup Harmony
 * @apiVersion  0.1.0
 * @apiDescription Send all the devices connected to the linked Harmony hub
 * 
 * @apiSuccess (200) {Object[]} harmonyDevices an array of devices connected to the Harmony hub
 * @apiUse authToken
 */
app.route('/api/modules/harmony/devices').get((req, res) => {
    if (!checkRequest(req, res)) return;

    res.json(modules.harmony.devices);
});

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
app.route('/api/modules/harmony/control/:device_name/:control_group/:control').get((req, res) => {
    if (!checkRequest(req, res)) return;

    var selectedControl = device_tools.getHarmonyControl(modules, req.params.device_name, req.params.control_group, req.params.control);

    if (selectedControl !== undefined) {
        harmony_tools.sendHarmonyCommand(modules, selectedControl.formattedCommand);
        res.sendStatus(200);
    } else {
        console.log('Harmony control not found: ' + req.params.control_group + ' ' + req.params.control);
        res.status(503).json({error:'Harmony control could not be found...'});
    }
});

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
app.route('/plex/webhook').post(upload.single('thumb'), (req, res, next) => {
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

//---------------------------------------------Proxmox API

/**
 * @api {get} /api/prox/nodes GetProxNodes
 * @apiName GetProxNodes
 * @apiGroup Proxmox
 * @apiVersion  0.1.0
 * @apiDescription Returns an array of nodes that the Proxmox server is aware of
 * 
 * @apiSuccess (200) {Object[]} nodes an array of nodes in the Proxmox server
 * @apiUse authToken
 */
app.route('/api/prox/nodes').get(async (req, res) => {
    if (!checkRequest(req, res)) return;

    var nodes = await prox_tools.getNodes(modules.prox);
    res.json(nodes);
});

/**
 * @api {get} /api/prox/cluster GetProxCluster
 * @apiName GetProxCluster
 * @apiGroup Proxmox
 * @apiVersion  0.1.0
 * @apiDescription Returns an array of clusters that the Proxmox server is aware of
 * 
 * @apiSuccess (200) {Object[]} nodes an array of clusters in the Proxmox server
 * @apiUse authToken
 */
app.route('/api/prox/cluster').get(async (req, res) => {
    if (!checkRequest(req, res)) return;

    var clusterStatus = await prox_tools.getClusterStatus(modules.prox);
    res.json(clusterStatus);
});

//---------------------------------------------OpenCV API

/**
 * @apiDefine linuxOnly
 * @apiError ModuleNotSupported this endpoint uses a module that is not available on the platform the server is running on
 * @apiErrorExample {json} Response (example):
 *      HTTP/2.0 501 Not Implemented
 *      {
 *          "error": "OpenCV only supported on Raspberry Pi"
 *      }
 */

/**
 * @api {get} /api/opencv/takepic OpenCVTakePicture
 * @apiName OpenCVTakePicture
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Tells the server to take a picture using an attached webcam
 * 
 * @apiSuccess (200) {HTTPStatus} OK-200 returns a status code of 200
 * @apiUse linuxOnly
 * @apiUse authToken
 */
app.route('/api/opencv/takepic').get((req, res) => {
    if (!checkRequest(req, res)) return;
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }
    var frame = modules.cv.webcam.read();
    modules.cv.imwrite('./opencv/' + (new Date()).toISOString() + '.jpg', frame);
    res.sendStatus(200);
});

/**
 * @api {get} /api/opencv/listpics OpenCVListPictures
 * @apiName OpenCVListPictures
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Returns a list of pictures taken by the server
 * 
 * @apiSuccess (200) {string[]} pictures a list of paths to the pictures taken
 * @apiError NoPictures no pictures were returned by this function
 * @apiErrorExample {json} Response (exmaple):
 *      HTTP/2.0 401 Not Found
 *      {
 *          "error": "Couldn't get pictures"
 *      }
 * @apiUse linuxOnly
 * @apiUse authToken
 */
app.route('/api/opencv/listpics').get((req, res) => {
    if (!checkRequest(req, res)) return;
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }

    var pictures = file_tools.getChildren('./opencv/');

    if (pictures !== undefined)
        res.status(200).json(pictures);
    else res.status(401).json({error: 'Couldn\'t get pictures'});
});

/**
 * @api {get} /api/opencv/getpic/:filename OpenCVDownloadPicture
 * @apiName OpenCVDownloadPicture
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Sends the picture specified in the request to the client
 * 
 * @apiParam (path) {string} filename the name of the image that should be downloaded
 * 
 * @apiSuccess (200) {application/octet-stream} picture the picture specified in the request as an octet-stream
 * @apiError NoPictures no pictures were returned by this function
 * @apiErrorExample {json} Response (exmaple):
 *      HTTP/2.0 401 Not Found
 *      {
 *          "error": "Couldn't get picture"
 *      }
 * @apiUse linuxOnly
 * @apiUse authToken
 */
app.route('/api/opencv/getpic/:filename').get((req, res) => { //idk if this works
    if (!checkRequest(req, res)) return;
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }
    if (file_tools.fileExists(req.params.filename)) {
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + req.params.filename
        });
        fs.createReadStream(req.query.filename).pipe(res);
    }
    else {
        res.status(401).json({error: 'Couldn\'t get picture'});
    }
});

//----------------------------------------------------Debug API

/**
 * @api {get} /debug/modules DebugModules
 * @apiName DebugModules
 * @apiGroup Debugging
 * @apiVersion  0.1.0
 * 
 * @apiSuccess (200) {string} response 'bet thanks' 
 * @apiSuccessExample {string} Success-Response:
 * {
 *     "success" : "bet thanks"
 * }
 */
app.route('/debug/modules').get( (req, res) => {
    console.log(modules);
    res.status(200).json({success:"bet thanks"}).end();
});

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
    if (!checkRequest(req, res)) return;

    res.status(200).json({success: "AuthTokenValid"});
});