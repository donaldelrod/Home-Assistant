//-------------NPM modules and Variables------------------------//
var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var app = express();
var options = {  
    key: fs.readFileSync('./https_key.pem', 'utf8'),  
    cert: fs.readFileSync('./https_cert.crt', 'utf8')  
}; 
var open = require('open');
var multer = require('multer');
var upload = multer({dest: '/plexpass/'});


//-------------API imports and Variables------------------------//
const { Client } = require('tplink-smarthome-api');
const TPClient = new Client();
var prox;
const NetgearRouter = require('netgear');
var ngrouter;
var routerDetails;
var harmony = require('harmonyhubjs-client');
//var harmonyHub;

//-------------Google Imports and Variables---------------------//
//const readline = require('readline');
const { google } = require('googleapis');
let google_oauth;


//-------------personal modules--------------------------------//
var file_tools = require('./file_tools.js');
var device_tools = require('./device_tools.js');
var prox_tools = require('./prox_tools.js');
var google_tools = require('./google_tools.js');
var module_tools = require('./module_tools.js');


//-------------Program Variables------------------------------//
const programPath = __dirname;
let settings;
var modulesPath = './modules.json';
var devicesPath = './devices.json'; 
var devices = [];
var modules = {};


//process all modules in the modules.json file
file_tools.readJSONFile(modulesPath).then(function(moduleList) {
       
    moduleList.forEach(function(type) {

        if (type.moduleName == 'proxmox') {
            try {
                prox = require('proxmox')(type.details.user, type.details.password, type.details.ip);
                modules.prox = prox;
                console.log('Proxmox connected Successfully');
            } catch(err) {
                console.log(err);
            }
            
            //prox_tools.getClusterStatus(prox);
        } else if (type.moduleName == 'google') {
            file_tools.readJSONFile(type.details.credentials).then(function (content) {
                const {client_secret, client_id, redirect_uris} = content.installed;
                google_oauth = new google.auth.OAuth2(
                    client_id, client_secret, redirect_uris[0]);
                
                google_tools.authorize(type.details, google_oauth);
            });
        } else if (type.moduleName == 'netgear') {
            modules.netgearRouter =  new NetgearRouter(type.details.password, type.details.user, type.details.host, type.details.port);
            modules.netgearRouter.routerDetails = modules.netgearRouter.discover().then(discovered => {
                console.log('Netgear Router connected successfully')
                return discovered;
            }).catch(err => console.log(err));
        } else if (type.moduleName == 'harmony') {
            modules.harmony = {};
            harmony(type.details.host).then(function(hub) {
                modules.harmony.hub = hub;

                modules.harmony.hub.getAvailableCommands().then(function(rawCommands) {
                    var tempHarmonyDevice;


                    var harmonyDevices = []; //what will be set to modules.harmony.devices
                    rawCommands.device.forEach(function(rawDevice) {
                        tempHarmonyDevice = {
                            deviceName: rawDevice.label,
                            controlPort: rawDevice.ControlPort,
                            manufacturer: rawDevice.manufacturer,
                            deviceType: rawDevice.type,//displayTypeDisplayName,
                            harmonyProfile: rawDevice.deviceProfileUri,
                            deviceModel: rawDevice.model,
                            isManualPower: rawDevice.isManualPower,
                            controlGroups: []
                        };
                        rawDevice.controlGroup.forEach(function(cg) {
                            tempCG = {
                                name: cg.name,
                                controls: []
                            };
                            cg.function.forEach(function(ctrl) {
                                tempCG.controls.push({
                                    name: ctrl.name,
                                    command: ctrl.action,
                                    formattedCommand: ctrl.action.replace(/\:/g, '::')
                                });
                            });
                            tempHarmonyDevice.controlGroups.push(tempCG);
                        });
                        harmonyDevices.push(tempHarmonyDevice);
                    });

                    modules.harmony.devices = harmonyDevices;

                });
            }).catch(function(err) {
                console.log(err);
            });
            console.log('Harmony Hub connected successfully')
        }
    });
}); 

process.on('exit', function(code) {
    modules.harmony.hub.end();
    console.log('safely exiting the program');
})


//reads devices.json for list of controlled devices
file_tools.readJSONFile(devicesPath).then(function(deviceList) {
    deviceList.forEach(function(type) {

        //move this to device_tools------------------------------------------------
        if (type.proto == 'tplink') {
            type.devices.forEach(function(device) {
                var tempDevice;
                try {
                    tempDevice = device;
                    if (device.deviceKind == 'tplink-plug') 
                        tempDevice.obj = TPClient.getPlug({host: device.ip});
                    else if (device.deviceKind == 'tplink-bulb') 
                        tempDevice.obj = TPClient.getBulb({host: device.ip});

                    //tempDevice.deviceName = device.name;
                    devices.push(tempDevice);
                    console.log(tempDevice.deviceKind + ' ' + tempDevice.name + ' conected successfully');
                } catch (err) {
                    console.log(err);
                }
            });
            //---------------------------------------------------------------------
        }
    })
});


var nonsecureServer = http.createServer(app).listen(9875);
var secureServer = https.createServer(options, app).listen(9876);

app.route('/api/devices/:deviceID/info').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index].getSysInfo().then(function (deviceInfo) {
        res.json(deviceInfo);
    }).catch(function (reason) {
        res.send(reason);
    });
});


app.route('/api/devices/:deviceID/set/:state').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device === undefined) {
        res.send('requested device doesn\'t exist!');
        return;
    }
    var state = req.params.state == 'on' ? true : (req.params.state == 'off' ? false : undefined);
    state = device_tools.setDeviceState(device, state);
    res.send("device " + index + ' turned ' + (state == true ? 'on' : 'off'));
});

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
                device_tools.setDeviceState(device, false);
            });
            break;
        case 1: //turn on group
            controlGroup.forEach(function(device) {
                device_tools.setDeviceState(device, true);
            });
            break;
        case 2: //toggle group
            controlGroup.forEach(function(device) {
                device_tools.setDeviceState(device, undefined);
            });
            break;
        default:
            res.send('no control implemented for ', control);
    }
    res.send('success');
});

app.route('/oauth2/google').get((req, res) => {
    var token_code = req.query.code;
    var scope_oauth = req.query.scope;
    res.send(google_tools.saveAccessToken(google_oauth, token_code));
});

app.route('/api/modules/google/cal/upcoming').get((req, res) => {
    google_tools.getGCalEvents(google_oauth, 15).then(function (events) {
        res.json(events);
    }).catch(function (reason) {
        res.send(reason);
    });
});

app.route('/api/modules/google/gmail/labels').get((req, res) => {
    google_tools.getGmailLabels(google_oauth);
    res.sendStatus(200);
});

app.route('/api/netgearrouter/attached').get((req, res) => {
    modules.netgearRouter.getAttachedDevices().then(function(attached) {
        res.send(attached);
        console.log(attached);
    });
});

app.route('/api/netgearrouter/info').get((req, res) => {
    modules.netgearRouter.getInfo().then(function(info) {
        res.send(info);
        console.log(info);
    })
});

app.route('/api/modules/harmony/devices').get((req, res) => {
    res.json(modules.harmony.devices);
});

app.route('/api/modules/harmony/control/:device_name/:control_group/:control').get((req, res) => {
    var selectedDevice = modules.harmony.devices.find((eachDevice) => {
        return eachDevice.deviceName === req.params.device_name;
    });
    var selectedCG = selectedDevice.controlGroups.find((cg) => {
            return cg.name === req.params.control_group;
    });
    var selectedControl = selectedCG.controls.find((thisControl) => {
        return thisControl.name === req.params.control;
    });
    modules.harmony.hub.send('holdAction', 'action=' + selectedControl.formattedCommand + ':status=press');

    res.sendStatus(200);
})

app.route('/plex/webhook').post(upload.single('thumb'), (req, res, next) => {
    var payload = JSON.parse(req.body.payload);
    console.log(payload);

    if (payload.event == 'media.play' && payload.Account.title == 'donaldelrod' && Player.title == 'PS4') {
        //add code here to turn off all lights in room but turn on PS4 sign
    }

    res.sendStatus(200);
});