var file_tools = require('./file_tools.js');
const NetgearRouter = require('netgear');
var google_tools = require('./google_tools.js');

module.exports = {
    sendHarmonyCommand: function(hub, command) {
        hub.send('holdAction', 'action=' + command + ':status=press');
    }
}