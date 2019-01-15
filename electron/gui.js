const electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var file_tools = require('../file_tools.js');

let config = {};


async function setup() {
    config = await file_tools.readJSONFile('./config.json');
    console.log(config);
}


async function createWindow() {
    await setup();
    
    win = new BrowserWindow({ width: 800, height: 600 });
    win.loadURL('https://' + config.host + '/api/devices/list?authToken=' + config.authToken);
}

app.on('ready', createWindow);
app.on('close', () => {win = null});
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (certificate.issuerName === config.certIssuer) {
        event.preventDefault();
        callback(true);
    }
    //console.log('cert error');
})