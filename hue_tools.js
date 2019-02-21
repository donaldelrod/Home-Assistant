var api_tools = require('./api_tools.js');
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
        var hueDevices = await this.getAllLights(modules);
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
        //console.log(hueDevices);
    },
    getAllLights: async function(modules) {
        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights';
        var lights = await api_tools.getRestHttp(url);
        return lights;
    },
    getLight: async function (modules, lightID) {
        var baseHost = 'http://' + modules.hue.ip;
        var basePath = '/api/' + modules.hue.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights/' + lightID;
        var light = await api_tools.getRestHttp(url);
        return light;
    },
    setLightState: async function (modules, lightID, state) {
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