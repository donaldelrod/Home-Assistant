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
//var os              = require('os');
var fs              = require('fs');
var http            = require('http');
var https           = require('https');
var express         = require('express');
var httpsoptions         =   {  
                            key: fs.readFileSync('./https_key.pem', 'utf8'),  
                            cert: fs.readFileSync('./https_cert.crt', 'utf8')  
                        };
// var schedule        = require('node-schedule');
//var cors            = require('cors');

// var platform = process.platform;


//-------------personal modules--------------------------------//
var file_tools      = require('./file_tools.js');
const Device        = require('./Devices/Device.js');

//-------------Program Variables------------------------------//
var activitiesPath  = './config/activities.json';
var profilesPath    = './config/profiles.json';
var configPath      = './config/config.json';

let globals         = require('./globals.js');

class HomeAssistantServer {

    constructor() {
        // array that contains the Device objects controlled by Home Assistant
        this.devices         = [];
        // array of Profiles that contain people in the household
        this.profiles        = [];
        // array of activites that can be run or scheduled
        this.activities      = [];
        // object that contains the config for the program to run
        this.config          = {};

        // this.modules         = globals.modules;//{};
        // array of scheduled functions that are set to run at regular intervals
        this.scheduledFunctions = [];
        // array of Device classes that are used to instantiate Device objects dynamically
        this.DeviceModules   = [];
        // object that contains various members used by plugins
        this.Plugins         = [];
        // array of Plugin classes that are used to load the plugins dynamically
        this.Plugins.classes = [];

        this.Plugins.plugins = [];

        this.app             = express();

        //let hb              = require('homebridge');
        this.hbs             = require('./Plugins/HomeBridge')();//(hb);

    }

    /**
     * Processes all known devices that will be controlled by the program
     * @async
     * @function processDevices
     * @param {Array<Object>} deviceList list of devices loaded from file
     */
    async processDevices(deviceConfig) {
        console.log('Connecting to devices...');

        // reserve spots for the devices loaded in the devices.json file
        let definedDeviceCount = 0;
        for (const devlist of deviceConfig.deviceModules) {
            if (devlist.devices === undefined)
                continue;
            definedDeviceCount += devlist.devices.length;
        }
        this.devices.length = definedDeviceCount;

        // here I load the device modules so that we can abstract away all of the implementation differences of different devices, as well as dynamically load device modules
        for (const deviceModule of deviceConfig.deviceModules) {

            this.DeviceModules[deviceModule.deviceType] = require(deviceModule.file);

            if (deviceModule.devices === undefined) {
                continue;
            }
            for (const device of deviceModule.devices) {
                var tempDevice;
                try {
                    // create the base Device object
                    // This is pretty dirty, need to find a cleaner way
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
        
                    // this creates an instantiation of a device module
                    let dev = this.DeviceModules[device.deviceProto];
                    tempDevice = new dev(tempDevice, device.details);
                    // call the setup function for the device: passing the devices array so controllers can add their devices
                    let successful_setup = await tempDevice.setup(this.devices)
                        .catch(err => {
                            console.log(err);
                        });
                    if (successful_setup) {
                        // inserts the device into the reserved spot in the devices array
                        this.devices[device.deviceID] = tempDevice;
                        console.log(tempDevice.deviceKind + ' ' + tempDevice.name + ' conected successfully');
                    } else {
                        console.log(tempDevice.deviceKind + ' ' + tempDevice.name + ' failed to connect');
                    }
                    
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    /**
     * Processes all modules that will be used by the program
     * @async
     * @function processModules
     * @param {Array<Object>} moduleList list of modules loaded from file
     */
    async processPlugins(pluginList) {
        console.log('Loading plugins...');

        for (const plugin of pluginList) {
            // require the class that represents this plugin and store it in the Plugins.classes array
            this.Plugins.classes[plugin.pluginName] = require(plugin.pluginFile);

            // instaintate the plugin
            let module_class = this.Plugins.classes[plugin.pluginName];
            let temp_plugin = new module_class(plugin.details);

            // push it into the array
            this.Plugins.plugins.push(temp_plugin);

            await temp_plugin.setup(this.Plugins);
        }
    }

    /**
     * Polls every device in devices that has the property 'pollable' for their state
     * Function is meant to be scheduled and run repeaedly
     * @function pollDevices
     */
    async pollDevices() {
        console.log('polling devices');
        // this.devices.forEach( (eachDevice) => {
        for (const eachDevice of this.devices) {
            if (eachDevice.pollable && !eachDevice.unavailable) {
                var state = await eachDevice.getDeviceState();
                Promise.resolve(state).then((currentState) => {
                    eachDevice.lastState = currentState;
                }).catch(err => console.log(err));
            }
        }
        globals.setDevices(this.devices);
    }

    /**
     * Queries the Netgear Router for the list of attached devices, and then checks the attached devices to see if they belong to anyone in the profiles list.
     * Profiles are updated with their owned devices, as well as a strength property that indicates the likelyhood they are at home
     * @async
     * @function checkWhoIsHome
     */
    async checkWhoIsHome() {
        console.log('checking who is home');

        let attachedDevices = [];

        // cycle through all plugins
        // this.Plugins.plugins.forEach( async (plugin) => {
        for (const plugin of this.Plugins.plugins) {
            // if the plugin has a getPresence function and is available
            if (plugin.getPresence !== undefined && !plugin.unavailable) {
                // get the devices that the plugin communicates with
                let att_dev = await plugin.getPresence();
                //add them to the list of attached devices
                att_dev.forEach((ad) => {
                    attachedDevices.push(ad);
                });
            }
        }

        console.log(attachedDevices);
        
        // cycle through all the presence devices
        attachedDevices.forEach((ad) => {
            // get the keys for the devices
            // these are standard, such as "ip", "bt", or "uid"
            let keys = Object.getOwnPropertyNames(ad);
            // now cycle through the profiles
            // this is the inner for loop as usually there will be more devices than profiles
            this.profiles.forEach((profile) => {
                // array to hold devices that match to the current profile
                let profileDevices = [];
                // cycle through the keys
                keys.forEach((key) => {
                    // check if the profile has an identifier that matches the device's identifier
                    if (profile.identifiers[key] !== undefined) {
                        // if so, cycle through the profile's array of that type of identifiers
                        profile.identifiers[key].forEach((identifier) => {
                            // check if one of the profile's identifier of that type matches the device's identifier
                            // for example, check if the profile Donald had an "ip" field,and if one of the values in the "ip" field's array of Donald matches the "ip" field of the attached device
                            if (identifier === ad[key]) {
                                profileDevices.push(ad);
                            }
                        });
                        
                    }
                });

                profile.strength = profileDevices.length;
                profile.devices = profileDevices;
            });
        });
    }

    /**
     * Runs the setup function, which loads all config and saved device/profile/module/activity data, and processes them in their respective functions
     * @async
     * @function setup
     */
    async setup() {
        this.config          = await file_tools.readJSONFile(configPath);
        this.profiles        = await file_tools.readJSONFile(profilesPath);
        this.activities      = await file_tools.readJSONFile(activitiesPath);

        await this.processDevices({
            deviceModules: this.config.deviceModules
        });

        await this.processPlugins(this.config.plugins);
        //await processModules(modules.list);
        //await activity_tools.processActivities(activities, scheduledFunctions, schedule);
        //processActivities();

        console.log('Home Assistant will be polling for device states every ' + parseInt(this.config.devicePollInterval)/60000 + ' minutes');
        console.log('Home Assistant will be checking who is home every ' + parseInt(this.config.whoIsHomeInterval)/60000 + ' minutes');

        this.pollDevices();
        //schedules the function pollDevices() to execute at intervals specified in the config file
        setInterval(this.pollDevices, parseInt(this.config.devicePollInterval)); 

        this.checkWhoIsHome();
        //schedules the function checkWhoIsHome() to execute at intervals specified in the config file
        setInterval(this.checkWhoIsHome, parseInt(this.config.whoIsHomeInterval));

        this.setupRoutes();

    }

    setupRoutes() {
        //adds cors functionality
        this.app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        /**
         * Express middleware that checks if the given API request has the needed credientals
         * @function checkRequest
         */
        this.app.use('/api', (req, res, next) => {
            // if (!req.secure) {
            //     res.status(401).send('Need HTTPS connection!');
            //     return;
            // } else
            
            // if the requested page is root or if the authToken is correct
            if (req.query.authToken !== this.config.authToken) {
                res.status(401).json({error: 'InvalidAuthToken'});
                return false;
            }
            next();    
        });

        // lets the documentation pages be served
        this.app.use('/', express.static('compiled/ng'));
        this.app.use('/docs/server', express.static('compiled/docs/server'));
        this.app.use('/docs/api', express.static('compiled/docs/api'));

        this.nonsecureServer = http.createServer(this.app);
        this.nonsecureServer.listen(9875);
        this.secureServer = https.createServer(httpsoptions, this.app);
        this.secureServer.listen(9876);

        let ngr = require('./routes/netgear.js')(this.Plugins.plugins[0])
        this.app.use('/api/netgear', ngr);

        this.app.use('/api/devices', require('./routes/devices.js')(this));
        this.app.use('/api/profiles', require('./routes/profiles.js'));
        this.app.use('/api/webhooks', require('./routes/webhooks.js'));
        this.app.use('/api/metrics', require('./routes/metrics.js'));
        this.app.use('/api/opencv', require('./routes/opencv.js'));
        this.app.use('/api/proxmox', require('./routes/proxmox.js'));
        this.app.use('/api/harmony', require('./routes/harmony.js'));
        this.app.use('/api/google', require('./routes/google.js'));

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
        this.app.route('/debug/testAuthToken').get( (req, res) => {
            //if (!checkRequest(req, res)) return;
            console.log(this.devices);
            res.status(200).json({success: "AuthTokenValid"});
        });
    }
}

//some cleaning on exit from the program
process.on('beforeExit', function(code) {
    console.log('exit code: ' + code);

    // var writableDevices = device_tools.getWritableDevices(devices);
    // var writableProfiles = device_tools.getWritableProfiles(profiles);
    // var writableActivities = device_tools.getWritableActivities(activities);
    // file_tools.writeJSONFile(devicesPath, writableDevices, function() {console.log('saved devices')});
    // file_tools.writeJSONFile(profilesPath, writableProfiles, function() {console.log('saved profiles')});
    // file_tools.writeJSONFile(activitiesPath, writableActivities, function() {console.log('saved activities')});
    // file_tools.writeJSONFile(modulesPath, modules, function() {console.log('saved modules')});

    console.log('safely exiting the program');
});

let HAS = new HomeAssistantServer();

HAS.setup();
