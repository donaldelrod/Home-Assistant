var express = require('express');
var app = express();
var file_tools = require('./file_tools.js');
const { Client } = require('tplink-smarthome-api');
const TPClient = new Client();

//var doc_tools = require('./doc_tools.js');
var file_tools = require('./file_tools.js');
//var api_tools = require('./api_tools.js');
 
const programPath = __dirname;
let settings;
let database;

var modulePath = './modules';
var devicesPath = './devices.json'; 

var devices = [];

file_tools.readJSONFile(devicesPath).then(function(deviceList) {
    deviceList.forEach(function(type) {
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
                devices.push(tempDevice);
            });
        }
    })
});


app.route('/api/:deviceID/on').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
        device.setPowerState(true);
    res.send("device " + index + ' turned off');//.getSysInfo());
});

app.route('/api/:deviceID/off').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    device.setPowerState(false);
    //res.send(device);//.getSysInfo());
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