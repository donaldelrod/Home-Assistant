/**
 * @fileoverview Collection of functions that control a Hue Bridge and the lights it controls
 * @author Donald Elrod
 * @version 1.0.0
 */

var api_tools = require('./api_tools.js');

/**
 * Collection of functions that control a Hue Bridge and the lights it controls
 * @exports hue_tools
 */
module.exports = {
    /**
     * Processes Hue lighting by connecting to the bridge and downloading connected device list
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @param {Object[]} devices devices array from the main script, will add harmony devices to the array
     * @param {Object} type the Netgear object loaded from the modules.json file (this is obtained during the initial forEach loop in the processModules function in server.js)
     */
    processHue: async function(modules, devices, type) {
        modules.hue = {
            ip: type.details.host,
            username: type.details.username
        };
        try {
            var hueDevices = await this.getAllLights(modules);
            if (hueDevices === null) {
                console.log('Home-Assistant was unable to connect to Hue Bridge at ' + type.details.host + ':80');
                modules.hue.unavailable = true;
                return;
            }
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
            console.log('Hue lights connected successfully')
        } catch (err) {
            console.log(err);
        }
        //console.log(hueDevices);
    },
    /**
     * Retrieves a list of all Hue devices connected to the Hue Bridge
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @returns {Object} Object containing all connected Hue devices
     */
    getAllLights: async function(modules) {
        if (modules.hue.unavailable)
            return null;

        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights';

        var lights = await api_tools.getRestHttp(url);
        return lights;
    },
    /**
     * Gets information about a specific Hue device
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @param {number} lightID the id of a Hue light
     * @returns {Object} returns the specified light as a JSON object
     */
    getLight: async function (modules, lightID) {
        if (modules.hue.unavailable)
            return null;

        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights/' + lightID;
        var light = await api_tools.getRestHttp(url);
        return light;
    },
    /**
     * Sets the on/off state of a Hue light
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @param {number} lightID the id of a Hue light
     * @param {boolean} state the state to set the light to
     */
    setLightState: async function (modules, lightID, state) {
        if (modules.hue.unavailable)
            return null;
            
        var baseHost = modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        //var baseURL = baseHost + basePath;
        var path = basePath + '/lights/' + lightID + "/state";
        var body =  JSON.stringify({on:state});
        api_tools.putRestHttp(baseHost, path, body)
            .catch(reason => console.log(reason));
        //return succ;
    }
}