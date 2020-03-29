/**
 * @fileoverview Collection of functions that deal with connecting to devices
 * @author Donald Elrod
 * @version 1.0.0
 */

var file_tools = require('./file_tools.js');

/**
 * Collection of functions that deal with connecting to devices
 * @exports device_tools
 */
module.exports = {
    /**
     * Converts the devices object to a .json friendly format
     * @param {Object} devices devices from server.js
     * @returns {Object} the writable version of the devices object
     */
    getWritableDevices: function(devices) {
        var writableDevices = devices.map((d) => {
            if (d.deviceProto === 'tplink') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.deviceType,
                    ip: d.ip,
                    groups: d.groups
                };
            } else if (d.deviceProto === 'tuyapi') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.deviceType,
                    ip: d.ip,
                    id: d.id,
                    key: d.key,
                    groups: d.groups
                };
            } else if (d.deviceProto === 'harmony') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.type,
                    ip: d.ip,
                    belongsToHub: d.belongsToHub,
                    hubInd: d.hubInd,
                    groups: d.groups,
                    controlPort: d.ControlPort,
                    manufacturer: d.manufacturer,
                    harmonyProfile: d.deviceProfileUri,
                    deviceModel: d.model,
                    isManualPower: d.isManualPower,
                    controlGroups: d.controlGroups
                };
            }
        });
        return writableDevices;
    },
    /**
     * Converts the modules object to a .json friendly format
     * @param {Object} modules modules object from server.js
     * @returns {Object} the writable version of the modules object
     */
    getWritableModules: function(modules) {
        //console.log(modules);
        return modules; //this is definitely not right, might have to edit modules only when changes are made to the config
    },
    /**
     * Converts the profiles object to a .json friendly format
     * @param {Object} profiles profiles object from server.js
     * @returns {Object} the writable version of the profiles object
     */
    getWritableProfiles: function(profiles) {
        //console.log(profiles);
        return profiles;
    },
    /**
     * Converts the activities object to a .json friendly format
     * @param {Object} activities activities object from server.js
     * @returns {Object} the writable version of the activities object
     */
    getWritableActivities: function(activities) {
        //console.log(activities);
        return activities;
    },
    /**
     * Creates an example json file for users to fill out with
     * Device data
     */
    createExampleDeviceConfig: function() {
        var sampleDevices = [
            {   
                note: "So far the only devices that should be manually added currently are tplink and tuyapi devices. This object in the array should also be deleted"
            },
            {
                name: "tplink Bedroom Lamp - Replace this with device name",
                deviceID: 0,
                deviceProto: "tplink",
                deviceKind: "tplink-plug - this can actually be whatever but it can't be changed from the front end",
                deviceType: "Wifi Plug -> Light - this can be changed from the front end",
                ip: "Put IP of device here",
                pollable: true,
                groups: [
                    "bedroom",
                    "lights",
                    "plugs"
                ]
            },
            {
                name: "Tuyapi Wifi Switch - Replace this with device name",
                deviceID: 1,
                deviceProto: "tuyapi",
                deviceKind: "tuyapi-switch - this can actually be whatever but it can't be changed from the front end",
                deviceType: "Wifi Switch -> Light - this can be changed from the front end",
                ip: "Put IP Here",
                id: "Tuyapi devices have a specific id and key - search online on how to find them (I used my iPhone)",
                key: "Same as above, I will post instructions on how to do this later",
                pollable: true,
                groups: [
                    "bedroom",
                    "lights",
                    "switches"
                ]
            }
        ];
        file_tools.writeJSONFile('devices.json', sampleDevices, function() {console.log("Sample device file successfully created")});
    }

};