//npm modules
var express = require('express');
var app = express();
const { Client } = require('tplink-smarthome-api');
const TPClient = new Client();
var prox;

const readline = require('readline');
const { google } = require('googleapis');


//personal modules
var file_tools = require('./file_tools.js');
var device_tools = require('./device_tools.js');
var prox_tools = require('./prox_tools.js');

 
const programPath = __dirname;
let settings;

var modulesPath = './modules.json';
var devicesPath = './devices.json'; 

var devices = [];
var modules = {};


file_tools.readJSONFile(modulesPath).then(function(moduleList) {
    moduleList.forEach(function(type) {

        if (type.moduleName == 'proxmox') {
            prox = require('proxmox')(type.details.user, type.details.password, type.details.ip);
            modules.prox = prox;
            //prox_tools.getClusterStatus(prox);
        }

    })
});


//reads devices.json for list of controlled devices
file_tools.readJSONFile(devicesPath).then(function(deviceList) {
    deviceList.forEach(function(type) {

        //move this to device_tools------------------------------------------------
        if (type.proto == 'tplink') {
            type.devices.forEach(function(device) {
                var tempDevice;
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
            });
            //---------------------------------------------------------------------
        }
    })
});

app.route('/api/:deviceID/info').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index].getSysInfo().then(function (deviceInfo) {
        res.json(deviceInfo);
    });
});


app.route('/api/:deviceID/set/:state').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    var state = req.params.state == 'on' ? true : (req.params.state == 'off' ? false : undefined);
    device_tools.setDeviceState(device, state);
    res.send("device " + index + ' turned ' + req.params.state);//.getSysInfo());
});


/**
 * This api returns the array of file in the category specified
 
app.route('/api/cats/:catName').get((req, res) => {
    var sent = false;
    database.root.cats.forEach(function(cat) {
        if (req.params.catName.toLowerCase() == cat.name.toLowerCase()) {
            res.json(cat);
            sent = true;
        }
    });
    if (!sent) {
        res.json({error:'category does not exist'});
    }
});*/


app.listen(9876);