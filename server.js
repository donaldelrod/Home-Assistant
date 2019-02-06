//-------------NPM modules and Variables------------------------//
var fs              = require('fs');
var http            = require('http');
var https           = require('https');
var express         = require('express');
var app             = express();
var options         =   {  
                            key: fs.readFileSync('./https_key.pem', 'utf8'),  
                            cert: fs.readFileSync('./https_cert.crt', 'utf8')  
                        };
var multer          = require('multer');
var upload          = multer({dest: '/plexpass/'});
var schedule        = require('node-schedule');
var scheduledFunctions = [];
var cors = require('cors');

var platform = process.platform;


//-------------API imports and Variables------------------------//
const { Client }    = require('tplink-smarthome-api');
const TPClient      = new Client();
var proxmox         = require('proxmox');
const NetgearRouter = require('netgear');
var harmony         = require('harmonyhubjs-client');
const TuyAPI        = require('tuyapi');


//-------------Google Imports and Variables---------------------//
const { google }    = require('googleapis');
let google_oauth;

//-------------personal modules--------------------------------//
var file_tools      = require('./file_tools.js');
var device_tools    = require('./device_tools.js');
var prox_tools      = require('./prox_tools.js');
var google_tools    = require('./google_tools.js');
var hue             = require('./hue.js');
//var module_tools    = require('./module_tools.js');
//const { Device }    = require('./angular/device.ts');

//-------------Program Variables------------------------------//
const programPath   = __dirname;
var modulesPath     = './modules.json';
var devicesPath     = './devices.json'; 
var activitiesPath  = './activities.json';
var profilesPath    = './profiles.json';
var configPath      = './config.json';

var devices         = [];
var profiles        = [];
var activities      = [];
var config          = {};
var modules         = {};


/**
 * Processes all activities that can be run by the program, and schedules programs with timing triggers
 */
function processActivities() {
    var activitiesToSchedule = activities.filter((eachActivity) => {
        return eachActivity.triggers.timeofday !== undefined;
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
        console.log('Scheduled ' + scheduledFunctions.length + ' activities, loaded a total of ' + activities.length + ' activities');
    }
}

/**
 * Processes all known devices that will be controlled by the program
 * @param {Array<Object>} deviceList list of devices loaded from file
 */
function processDevices(deviceList) {
    console.log('Connecting to devices...');
    //var ind = 0;
    deviceList.forEach(function(device) {
        var tempDevice;
        try {
            tempDevice = device;
            if (device.deviceKind === 'tplink-plug') 
                tempDevice.obj = TPClient.getPlug({host: device.ip});

            else if (device.deviceKind === 'tplink-bulb') 
                tempDevice.obj = TPClient.getBulb({host: device.ip});

            else if (device.deviceProto === 'harmony') {
                //don't think I need to do anything here but saving this space in case I do
            } 
            
            else if (device.deviceProto === 'tuyapi') {
                tempDevice.obj = new TuyAPI({
                    id: device.id,
                    key: device.key,
                    ip: device.ip
                });
            }
            devices.push(tempDevice);
            console.log(tempDevice.deviceKind + ' ' + tempDevice.name + ' conected successfully');
        } catch (err) {
            console.log(err);
        }
    });
    //pollDevices();
    //setInterval(pollDevices, 150000);
}

/**
 * Processes all modules that will be used by the program
 * @param {Array<Object>} moduleList list of modules loaded from file
 */
async function processModules(moduleList) {
    console.log('Connecting to modules...');
    moduleList.forEach(async function(type) {
        //deal with proxmox setup
        if (type.moduleName == 'proxmox') {
            try {
                modules.prox = proxmox(type.details.user, type.details.password, type.details.ip);
                console.log('Proxmox connected Successfully');
            } catch(err) {
                console.log(err);
            }            
        } 
        //deal with google account setup
        else if (type.moduleName == 'google') {
            file_tools.readJSONFile(type.details.credentials).then(function (content) {
                const {client_secret, client_id, redirect_uris} = content.installed;
                google_oauth = new google.auth.OAuth2(
                    client_id, client_secret, redirect_uris[0]);
                
                google_tools.authorize(type.details, google_oauth);
            });
        } 
        //deal with netger router setup
        else if (type.moduleName == 'netgear') {
            modules.netgearRouter =  new NetgearRouter(type.details.password, type.details.username, type.details.host, type.details.port);
            modules.netgearRouter.storedPass = type.details.password;
            modules.netgearRouter.storedUser = type.details.username;
            modules.netgearRouter.storedHost = type.details.host;
            modules.netgearRouter.storedPort = type.details.port;
            
            modules.netgearRouter.routerDetails = modules.netgearRouter.discover().then(discovered => {
                console.log('Netgear Router connected successfully');
                // checkWhoIsHome();
                // setInterval(checkWhoIsHome, 300000);
                return discovered;
            }).catch(err => console.log(err));
        } 
        //deal with harmony hub setup
        else if (type.moduleName == 'harmony') {
            modules.harmony = {};
            modules.harmony.devices = [];
            modules.harmony.hubs = [];
            type.details.forEach(/*function*/ (harmonyHost, hi) => {
                var hubInd = hi;
                harmony(harmonyHost.host).then(function(hub) {
                    hub.hubName = harmonyHost.hubName;
                    modules.harmony.hubs.push(hub);
                    //console.log(modules.harmony.hubs[hubInd]);
                    //modules.harmony.hubs[hubInd].name = harmonyHost.hubName;
                    /*modules.harmony.hubs[hubInd]*/
                    hub.getAvailableCommands().then(function(rawCommands) {
                        var tempHarmonyDevice;
    
                        var harmonyDevices = []; //what will be set to modules.harmony.devices
                        rawCommands.device.forEach(function(rawDevice) {
                            tempHarmonyDevice = {
                                name: rawDevice.label,
                                deviceID: devices.length,
                                deviceProto: 'harmony',
                                deviceKind: 'harmony-'+rawDevice.type,
                                deviceType: rawDevice.type,
                                ip: "",
                                pollable: false,
                                groups: [],
                                controlPort: rawDevice.ControlPort,
                                manufacturer: rawDevice.manufacturer,
                                harmonyProfile: rawDevice.deviceProfileUri,
                                deviceModel: rawDevice.model,
                                isManualPower: rawDevice.isManualPower,
                                controlGroups: [],
                                lastState: false,
                                belongsToHub: harmonyHost.hubName,
                                hubInd: hubInd
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
                            var inDevices = false;
                            devices.forEach(function(d) {
                                if (d.name === tempHarmonyDevice.name)
                                    inDevices = true;
                            });
    
                            //only push to devices if the device is new, so harmony devices can be 
                            //stored and further customized in the program
                            //devices are saved to devices.json after being added once
                            if (!inDevices)
                                devices.push(tempHarmonyDevice);
                        });
                        harmonyDevices.forEach(function (harmDev) {
                            modules.harmony.devices.push(harmDev);
                        });
                        
                    });
                    //hubInd++;
                }).catch(err => console.log(err));
                console.log('Harmony Hub connected successfully');
                
            });
            
        }
        else if (type.moduleName === 'hue') {
            modules.hue = {
                ip: type.details.host,
                username: type.details.username
            };
            var hueDevices = await hue.getAllLights(modules);
            var i = 1;
            while(hueDevices[''+i] !== undefined) {
                var hueDevice = hueDevices[''+i];
                var tempDevice = {
                    deviceID: devices.length,
                    name: hueDevice.name,
                    deviceType: hueDevice.type,
                    deviceProto: 'hue',
                    deviceKind: hueDevice.productid,
                    manufacturer: hueDevice.manufacturername,
                    groups: ['lights','hue'],
                    lastState: hueDevice.state.on,
                    isToggle: true,
                    model: hueDevice.modelid,
                    harmonyControl: false,
                    hueControl: true,
                    hue: {
                        capabilities: hueDevice.capabilities,
                        config: hueDevice.config,
                        uid: hueDevice.uniqueid,
                        swversion: hueDevice.swversion,
                        state: hueDevice.state,
                        hueID: i
                    }
                };
                var inDevices = false;
                devices.forEach(function (device) {
                    if (device.name === tempDevice.name)
                        inDevices = true;
                });
                if (!inDevices)
                    devices.push(tempDevice);
                i++;
            }
            console.log('Hue successfully connected')
            console.log(hueDevices);
        }
        //deal with opencv module, which will only be supported on linux/raspberry pi (for now at least)
        else if (type.moduleName === 'opencv' && platform === 'linux') {
            modules.cv = require('opencv4nodejs');
            modules.cv.webcam = new modules.cv.VideoCapture(parseInt(type.details.devicePort));
        }
    });
}

/**
 * Polls every device in devices that has the property 'pollable' for their state
 * Function is meant to be scheduled and run repeaedly
 */
function pollDevices() {
    console.log('polling devices');
    devices.forEach( (eachDevice) => {
        if (eachDevice.pollable) {
            var state = device_tools.getDeviceState(eachDevice);
            Promise.resolve(state).then((newState) => {
                eachDevice.lastState = newState;
            }).catch(err => console.log(err));
        }
    });
}

function getSendableDevice(id) {
    var dev_list = devices.map((d, ind) => {
        var sendableDevice = {
            deviceID: d.deviceID,
            name: d.name,
            deviceType: d.deviceType,
            deviceKind: d.deviceKind,
            proto: d.deviceProto,
            groups: d.groups,
            lastState: d.lastState,
            isToggle: true,
            lastStateString: d.lastState ? 'on' : 'off',
            harmonyControls: false
        };
        if (d.deviceProto === 'harmony') {
            sendableDevice.harmony = d.controlGroups;
            sendableDevice.harmonyControls = true;
        }
        return sendableDevice;
    });
    return dev_list[id];
}

function getSendableDevices() {
    var dev_list = devices.map((d, ind) => { 
        var sendableDevice = {
            deviceID: ind,
            name: d.name,
            deviceType: d.deviceType,
            deviceKind: d.deviceKind,
            proto: d.deviceProto,
            groups: d.groups,
            lastState: d.lastState,
            isToggle: true,
            lastStateString: d.lastState ? 'on' : 'off',
            harmonyControls: false
        };
        if (d.deviceProto === 'harmony') {
            sendableDevice.harmony = d.controlGroups;
            sendableDevice.harmonyControls = true;
        }
        return sendableDevice;
    });
    return dev_list;
}

/**
 * Queries the Netgear Router for the list of attached devices, and then checks the attached devices to see if they belong to anyone in the profiles list.
 * Profiles are updated with their owned devices, as well as a strength property that indicates the likelyhood they are at home
 */
function checkWhoIsHome() {
    //var attachedDevices;
    console.log('checking who is home');
    modules.netgearRouter.login(modules.netgearRouter.storedPass, modules.netgearRouter.storedUser, modules.netgearRouter.storedHost, modules.netgearRouter.storedPort).then(function(successfulLogin) {
        if (successfulLogin) {
            modules.netgearRouter.getAttachedDevices().then((attached) => {
                modules.netgearRouter.lastConnectedDevices = attached;
                profiles.forEach(function(profile) {
                    var profileDevices = attached.filter((attd) => {
                        return profile.identifiers.ip.includes(attd.IP)
                    });
                    profile.strength = profileDevices.length;
                    profile.devices = profileDevices;
                });
            });
        }
    }).catch(err => console.log(err));
}


async function setup() {
    config          = await file_tools.readJSONFile(configPath);
    profiles        = await file_tools.readJSONFile(profilesPath);
    modules.list    = await file_tools.readJSONFile(modulesPath);
    activities      = await file_tools.readJSONFile(activitiesPath);
    var deviceList  = await file_tools.readJSONFile(devicesPath);
    
    processDevices(deviceList);
    processModules(modules.list);
    processActivities();

    console.log('Home Assistant will be polling for device states every ' + parseInt(config.devicePollInterval)/60000 + ' minutes');
    console.log('Home Assistant will be checking who is home every ' + parseInt(config.whoIsHomeInterval)/60000 + ' minutes');

    pollDevices();
    setInterval(pollDevices, parseInt(config.devicePollInterval)); //poll devices every 2.5 minutes

    checkWhoIsHome();
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

app.use(cors());

var nonsecureServer = http.createServer(app).listen(9875);
var secureServer = https.createServer(options, app).listen(9876);

//----------------Device API

//lists all the currently known/controllable devices
app.route('/api/devices/list').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    var dev_list = getSendableDevices();
 
    console.log(dev_list);
    res.json(dev_list);
});

//gets info about the specific device
app.route('/api/devices/:deviceID/info').get(async (req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    var index = parseInt(req.params.deviceID);
    // if (devices[index].deviceProto === 'tplink') {
    //     var info = await devices[index].getSysInfo();/*.then(function (deviceInfo) {
    //         res.json(deviceInfo);
    //     }).catch(function (reason) {
    //         res.send(reason);
    //     });*/
    //     res.send(info);
    // }
    let d = getSendableDevice(index);
    res.json(d);
});

//sets the state of an individual device
app.route('/api/devices/:deviceID/set/:state').get( async (req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device === undefined) {
        res.send(null);
        //!!!!!!!!!!!!!!!!!!!!!!need to change this
        return;
    }
    var state = req.params.state === '1' ? true : (req.params.state === '0' ? false : undefined);
    
    let d = await device_tools.setDeviceState(device, state, modules);
    if (d === undefined) {
        res.json(null);
        return;
    }
    let dd = getSendableDevice(d.deviceID);
    res.json(dd);
});

//controls the state of a group of devices
app.route('/api/groups/:control').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
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

//runs the activity with the name :name
app.route('/api/activities/name/:name').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    device_tools.runActivity(modules, activities, devices, req.params.name).then((success) => {
        res.status(success ? 200 : 503).send( (success ? 'successfully ran ' : 'failed to run ') + 'activity ' + req.params.name);
    });
});

//returns the list of people at the house
app.route('/api/people/list').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    res.json(profiles);
});

//return all scheduled activities
app.route('/api/activities/scheduled').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    var sch = scheduledFunctions.map((eachFunction) => {
        return eachFunction.jobname;
    });
    res.json(sch);
});

//-------------------------------Google API

//the OAuth2 endpoint of the server so you can log in
app.route('/oauth2/google').get((req, res) => {
    var token_code = req.query.code;
    var scope_oauth = req.query.scope;
    res.send(google_tools.saveAccessToken(google_oauth, token_code));
});

//gets upcoming events in your Google Calendar
app.route('/api/modules/google/cal/upcoming').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    google_tools.getGCalEvents(google_oauth, 15).then(function (events) {
        res.json(events);
    }).catch(function (reason) {
        res.send(reason);
    });
});

//doesn't really do anything but I'm leaving it here to remind me to fix it
app.route('/api/modules/google/gmail/labels').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    google_tools.getGmailLabels(google_oauth);
    res.sendStatus(200);
});

//-------------------------Netgear API

//returns all the devices connected to the netgear router
app.route('/api/netgearrouter/attached').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    modules.netgearRouter.login(modules.netgearRouter.storedPass, modules.netgearRouter.storedUser, modules.netgearRouter.storedHost, modules.netgearRouter.storedPort).then(function(successfulLogin) {
        if (successfulLogin) {
            modules.netgearRouter.getAttachedDevices().then(function(attached) {
                modules.netgearRouter.lastConnectedDevices = attached;
                res.send(attached);
            });
        }
    });
});

//returns info about the netgear router
app.route('/api/netgearrouter/info').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    modules.netgearRouter.login(modules.netgearRouter.storedPass, modules.netgearRouter.storedUser, modules.netgearRouter.storedHost, modules.netgearRouter.storedPort).then(function(successfulLogin) {
        if (successfulLogin) {
            modules.netgearRouter.getInfo().then(function(info) {
                res.send(info);
            });
        }
    });
});

//---------------------------Harmony API

//send all the harmony devices
app.route('/api/modules/harmony/devices').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    res.json(modules.harmony.devices);
});

//control a specific harmony device by specifying a device name, control group and control
app.route('/api/modules/harmony/control/:device_name/:control_group/:control').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    }
    var selectedControl = device_tools.getHarmonyControl(modules, req.params.device_name, req.params.control_group, req.params.control);

    if (selectedControl !== undefined) {
        device_tools.sendHarmonyCommand(modules, selectedControl.formattedCommand);
        res.sendStatus(200);
    } else {
        console.log('Harmony control not found: ' + req.params.control_group + ' ' + req.params.control);
        res.status(503).send('Harmony control could not be found...');
    }
    
    
});

//------------------Plex API

//reacts to plex's webhooks, and will look through activities to see if any will be triggered by this webhook
app.route('/plex/webhook').post(upload.single('thumb'), (req, res, next) => {
    var payload = JSON.parse(req.body.payload);
    console.log(payload);

    activities.filter((eachActivity) => {
        return eachActivity.triggers.plex !== undefined;
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

//--------------OpenCV API

app.route('/api/opencv/takepic').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    } else if (platform !== 'linux') {
        res.status(401).send('OpenCV only supported on Raspberry Pi');
        return;
    }
    var frame = modules.cv.webcam.read();
    modules.cv.imwrite('./opencv/' + (new Date()).toISOString() + '.jpg', frame);
});

app.route('/api/opencv/listpics').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    } else if (platform !== 'linux') {
        res.status(401).send('OpenCV only supported on Raspberry Pi');
        return;
    }
    var pictures = file_tools.getChildren('./opencv/');
    if (pictures !== undefined)
        res.status(200).json(pictures);
    else res.status(401).send('Couldn\'t get pictures');
});

app.route('/api/opencv/getpic/:filename').get((req, res) => {
    // if (!req.secure) {
    //     res.status(401).send('Need HTTPS connection!');
    //     return;
    // } else 
    if (req.query.authToken !== config.authToken) {
        res.status(401).send('Need valid token!');
        return;
    } else if (platform !== 'linux') {
        res.status(401).send('OpenCV only supported on Raspberry Pi');
        return;
    }
    if (file_tools.fileExists(req.params.filename)) {
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + req.params.filename
        });
        fs.createReadStream(req.query.filename).pipe(res);
    }
});