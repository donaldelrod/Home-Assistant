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



// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, details, callback) {
//     const {client_secret, client_id, redirect_uris} = credentials.installed;
//     gcal_oauth = new google.auth.OAuth2(
//         client_id, client_secret, redirect_uris[0]);
  
//     // Check if we have previously stored a token.
//     fs.readFile(details.token_path, (err, token) => {
//         if (err) return getAccessToken(gcal_oauth, details, callback);
//         gcal_oauth.setCredentials(JSON.parse(token));
//         callback(gcal_oauth);
//       });
//   }


// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback for the authorized client.
//  */
// function getAccessToken(oAuth2Client, details, callback) {
//     const authUrl = oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: details.scopes,
//     });
//     open(authUrl, function(err) {
//         if (err) console.log(err);
//     });
//     console.log('Authorize this app by visiting this url:', authUrl);
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     rl.question('Enter the code from that page here: ', (code) => {
//       rl.close();
//       oAuth2Client.getToken(code, (err, token) => {
//         if (err) return console.error('Error retrieving access token', err);
//         oAuth2Client.setCredentials(token);
//         // Store the token to disk for later program executions
//         fs.writeFile(details.token_path, JSON.stringify(token), (err) => {
//             if (err) console.error(err);
//             console.log('Token stored to', details.token_path);
//         });
//         callback(oAuth2Client);
//       });
//     });
//   }


//   /**
//  * Lists the next 10 events on the user's primary calendar.
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function getGCalEvents(auth, numEvents) {
//     const calendar = google.calendar({version: 'v3', auth});
//     //var eventData = [];
//     return new Promise(function (resolve, reject) {
//         calendar.events.list({
//             calendarId: 'primary',
//             timeMin: (new Date()).toISOString(),
//             maxResults: numEvents,
//             singleEvents: true,
//             orderBy: 'startTime',
//         }, (err, res) => {
//             if (err)
//                 reject('The API returned an error: ' + err);
//             const events = res.data.items;
//             if (events.length)
//                 resolve(events);
//             else {
//               reject('No upcoming events found.');
//               console.log('No upcoming events found.');
//             }
//         });
//     });
// }

// /**
//  * Lists the labels in the user's account.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function getGmailLabels(auth) {
//     const gmail = google.gmail({version: 'v1', auth});
//     gmail.users.labels.list({
//       userId: 'me',
//     }, (err, res) => {
//       if (err) return console.log('The API returned an error: ' + err);
//       const labels = res.data.labels;
//       if (labels.length) {
//         console.log('Labels:');
//         labels.forEach((label) => {
//           console.log(`- ${label.name}`);
//         });
//       } else {
//         console.log('No labels found.');
//       }
//     });
//   }

var secureServer = https.createServer(options, app).listen(9876);

app.route('/api/devices/:deviceID/info').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index].getSysInfo().then(function (deviceInfo) {
        res.json(deviceInfo);
    });
});


app.route('/api/devices/:deviceID/set/:state').get((req, res) => {
    var index = parseInt(req.params.deviceID);
    var device = devices[index];
    if (device === undefined) {
        res.send('requested device doesn\'t exist!');
        return
    }
    var state = req.params.state == 'on' ? true : (req.params.state == 'off' ? false : undefined);
    state = device_tools.setDeviceState(device, state);
    res.send("device " + index + ' turned ' + (state == true ? 'on' : 'off'));
});

app.route('/oauth2/google').get((req, res) => {
    var token_code = req.query.code;
    var scope_oauth = req.query.scope;
    res.send(google_tools.saveAccessToken(google_oauth, token_code));
    // res.json({
    //     token: token_code,
    //     scope: scope_oauth
    // });
});

app.route('/api/gcal/upcoming').get((req, res) => {
    google_tools.getGCalEvents(google_oauth, 15).then(function (events) {
        res.json(events);
    }).catch(function (reason) {
        res.send(reason);
    });
});

app.route('/api/gmail/recent').get((req, res) => {
    google_tools.getGmailLabels(google_oauth);
})