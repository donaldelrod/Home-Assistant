/**
 * @fileoverview Collection of functions that deal with connecting to Harmony Hubs
 * @author Donald Elrod
 * @version 1.0.0
 */
var harmony         = require('harmonyhubjs-client');
var HarmonyDevice   = require('./Devices/HarmonyDevice');
/**
 * Collection of functions that deal with connecting to Harmony Hubs
 * @exports harmony_tools
 */
module.exports = {
    /**
     * Processes Harmony Hubs during program setup, this function will connect to all
     * Harmony hubs in the modules file and add the devices they control to both the modules object and the devices array
     * @param {Object} modules modules object from the main script, will store harmony functions in it
     * @param {Object[]} devices devices array from the main script, will add harmony devices to the array
     * @param {Object} type the Harmony object loaded from the modules.json file (this is obtained during the initial forEach loop in the processModules function in server.js)
     */
    processHarmonyHubs: function(modules, devices, type) {
        modules.harmony = {};
            modules.harmony.devices = [];
            modules.harmony.hubs = [];
            type.details.forEach( (harmonyHost, hi) => {
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
                                deviceProto: 'HarmonyDevice',
                                deviceKind: 'Harmony - ' + rawDevice.type,
                                deviceType: rawDevice.type,
                                ip: "",
                                pollable: false,
                                groups: ["harmony"],
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
                            if (!inDevices) {
                                let newHarmonyDevice = new HarmonyDevice(tempHarmonyDevice, hub);
                                devices.push(newHarmonyDevice);
                            }
                                
                        });
                        harmonyDevices.forEach(function (harmDev) {
                            modules.harmony.devices.push(harmDev);
                        });
                    });
                    //hubInd++;
                }).catch( (err) => {
                    console.log(err);
                    console.log("unable to connect to harmony hub");
                });
                console.log('Harmony Hub connected successfully');
            });
    },
    /**
     * Sends the formatted command to the connected Harmony Hub
     * @param {Object} modules modules object from server.js
     * @param {string} formattedCommand Harmony-specific command string, tells the hub what button to emulate
     */
    sendHarmonyCommand: function(modules, formattedCommand, hubName) {
        var hub = modules.harmony.hubs.filter(h => {
            return h.hubName === hubName;
        }).pop();//[hubInd];
        hub.send('holdAction', 'action=' + formattedCommand + ':status=press');
    }
};