//-------------NPM modules and Variables------------------------//
var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var options = {  
    key: fs.readFileSync('./https_key.pem', 'utf8'),  
    cert: fs.readFileSync('./https_cert.crt', 'utf8')  
}; 
var open = require('open');


//-------------API imports and Variables------------------------//
const { Client } = require('tplink-smarthome-api');
const TPClient = new Client();
var prox;
const NetgearRouter = require('netgear');
var ngrouter;

//-------------Google Imports and Variables---------------------//
const readline = require('readline');
const { google } = require('googleapis');
let google_oauth;


//-------------personal modules--------------------------------//
var file_tools = require('./file_tools.js');
var device_tools = require('./device_tools.js');
var prox_tools = require('./prox_tools.js');
var google_tools = require('./google_tools.js');


//-------------Program Variables------------------------------//
const programPath = __dirname;
let settings;
var modulesPath = './modules.json';
var devicesPath = './devices.json'; 
var devices = [];
var modules = {};



file_tools.readJSONFile(modulesPath).then(function(moduleList) {
    moduleList.forEach(function(type) {
        //-------------Move to module_tools.js----------------//
        if (type.moduleName == 'proxmox') {
            try {
                prox = require('proxmox')(type.details.user, type.details.password, type.details.ip);
                modules.prox = prox;
                console.log('Proxmox Connected Successfully');
            } catch(err) {

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
            ngrouter =  new NetgearRouter(type.details.password, type.details.user, type.details.host, type.details.port);
            ngrouter.discover().then(discovered => {
                
                console.log(discovered)
            }).catch(err => console.log(err));
        }
        //-----------------------------------------------------//
    });
}); 


//reads devices.json for list of controlled devices
file_tools.readJSONFile(devicesPath).then(function(deviceList) {
    deviceList.forEach(function(type) {

        //move this to device_tools------------------------------------------------
        if (type.proto == 'tplink') {
            type.devices.forEach(function(device) {
                var tempDevice;
                try {
                    if (device.kind == 'plug') {
                        tempDevice = TPClient.getPlug({host: device.ip});
                        tempDevice.deviceKind = "tplink-plug";
                    }
                    else {
                        tempDevice = TPClient.getBulb({host: device.ip});
                        tempDevice.deviceKind = "tplink-bulb";
                    }
                    tempDevice.deviceName = device.name;
                    devices.push(tempDevice);
                    console.log('TPLink Device ' + tempDevice.deviceName + ' Conected Successfully');
                } catch (err) {
                    console.log(err);
                }
            });
            //---------------------------------------------------------------------
        }
    })
});

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
});

app.route('/plex/webhook').post((req, res) => {
    console.log('post');
    console.log(req);
});