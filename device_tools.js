/**
 * @fileoverview Collection of functions that deal with connecting to devices
 * @author Donald Elrod
 * @version 1.0.0
 */

var hue_tools = require('./hue_tools.js');
var harmony_tools = require('./harmony_tools.js');
var file_tools = require('./file_tools.js');

/**
 * Collection of functions that deal with connecting to devices
 * @exports device_tools
 */
module.exports = {
    // /**
    //  * Sends the formatted command to the connected Harmony Hub
    //  * @param {Object} modules modules object from server.js
    //  * @param {string} formattedCommand Harmony-specific command string, tells the hub what button to emulate
    //  */
    // sendHarmonyCommand: function(modules, formattedCommand, hubName) {
    //     var hub = modules.harmony.hubs.filter(h => {
    //         return h.hubName === hubName;
    //     }).pop();//[hubInd];
    //     hub.send('holdAction', 'action=' + formattedCommand + ':status=press');
    // },
    /**
     * Sets the state of supported devices/protocols. Supported devices currently are:
     * - TPLink
     * - Tuyapi
     * - Harmony devices (only sets/toggles power)
     * @param {Object} device device object to set the state of
     * @param {boolean} state true for on, false for off, undefined for toggle
     * @param {Object} modules modules object from server.js
     * @returns {Device} the new state of the device
     */
    setDeviceState: async function(device, state, modules) {
        var toggle = state === undefined;
        if (toggle) {
            if (device.deviceProto === 'harmony') {

                var powerControl = this.getHarmonyControl(modules, device.name, 'Power', 'PowerToggle');

                if (powerControl !== undefined) {
                    harmony_tools.sendHarmonyCommand(modules, powerControl.formattedCommand, device.belongsToHub);
                    device.lastState = device.lastState === undefined ? undefined : !device.lastState;
                } else {
                    console.log('Harmony control not found: Power PowerToggle');
                    return undefined;
                }
            } //else if (device.deviceProto === 'hue') {
            //else await device
            //}
            return device;
        }
        //if we are not toggling the power and instead setting the state directly
        if (device.deviceProto === 'tplink') {
            device.obj.setPowerState(state);
            power_state = state;
            device.lastState = state;
        } else if (device.deviceProto === 'tuyapi') {
            await device.obj.set({set: state}).then(result => {
                power_state = state;
                if (result) {
                    console.log('successfully set state to ' + state);
                    device.lastState = state;
                }
                else console.log('failed to set state to true');
            }).catch(err => console.log(err));
            
        }
        else if (device.deviceProto === 'harmony') {
            var control = state === true ? 'PowerOn' : 'PowerOff';
            var powerControl = this.getHarmonyControl(modules, device.name, 'Power', control);

            if (powerControl !== undefined) {
                harmony_tools.sendHarmonyCommand(modules, powerControl.formattedCommand, device.belongsToHub);
                power_state = state;
                device.lastState = state;
            } else {
                console.log('Harmony control not found: Power ' + control);
                return undefined;
            }
        } else if (device.deviceProto === 'hue') {
            await hue_tools.setLightState(modules, device.hue.hueID, state);
            device.lastState = state;
            //if (ret[0]['success'] === undefined)
            //    return undefined;
        }
        return device;
    },
    /**
     * Finds the specific Harmony control for the given input
     * @param {Object} modules modules object from server.js
     * @param {string} deviceName the name of the device to get the controls for
     * @param {string} controlGroup the control group of the control, i.e. 'Power'
     * @param {string} control the specific control, i.e. 'VolumeUp'
     * @returns {Object} the object for the specified control
     */
    getHarmonyControl: function(modules, deviceName, controlGroup, control) {
        var selectedDevice = modules.harmony.devices.find((eachDevice) => {
            return eachDevice.name === deviceName;
        });
        if (selectedDevice === undefined)
            return undefined;
        var selectedCG = selectedDevice.controlGroups.find((cg) => {
                return cg.name === controlGroup;
        });
        if (selectedCG === undefined)
            return undefined;
        var selectedControl = selectedCG.controls.find((thisControl) => {
            return thisControl.name === control;
        });
        return selectedControl;
    },
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
     * Handles running activities provided all necessary objects.
     * @param {Object} modules the modules object from server.js, which contains specific module functions
     * @param {Object} activities the activities object from server.js, which holds all activities
     * @param {Object} devices the devices object from server.js, which contains all devices
     * @param {string} activityName name of the activity to be run
     * @returns {Promise<boolean>} whether the activity ran successfully or not
     */
    runActivity: async function(modules, activities, devices, activityName) {
        var activity = activities.find((eachActivity) => {
            return eachActivity.name.toLowerCase() === activityName.toLowerCase();
        });
        console.log('running activity ' + activity.name);
        activity.commands.forEach(async (command) => {

            //if the command is a function, handle it here
            if (command.function !== undefined) {
                var funcParts = command.function.split(' ');
                if (funcParts[0] === 'delay') 
                    await delay(parseInt(funcParts[1]));
                return;
            }

            //otherwise, get the device that is being controlled by this command
            var commandingDevice = devices.find((eachDevice) => {
                return eachDevice.name === command.device; //if this device matches the device name in the activity command
            });

            var controlParams = command.control.split(' ');
            //if the control protocol is in the set of devices compatible with the setDeviceState function
            if (controlParams[0] === 'tplink' || controlParams[0] === 'tuyapi') {
                var newState;
                if (controlParams[1] === 'PowerOff')
                    newState = false;
                else if (controlParams[1] === 'PowerOn')
                    newState = true;
                else if (controlParams[1] === 'PowerToggle')
                    newState = undefined;
                this.setDeviceState(commandingDevice, newState, modules);
            } else if (controlParams[0] === 'harmony') { //else the device is a harmony controlled device
                var controlGroup = controlParams[1];
                var control = controlParams[2];
                var selectedControl = this.getHarmonyControl(modules, commandingDevice.name, controlGroup, control);

                if (selectedControl !== undefined) {
                    harmony_tools.sendHarmonyCommand(modules, selectedControl.formattedCommand, commandingDevice.hubInd);

                    //update last state of device if the is a power command
                    if (controlGroup === 'Power')
                        commandingDevice.lastState = control === 'PowerOn' ? true : false;
                } else {
                    console.log('Harmony control not found: ' + controlGroup + ' ' + control);
                }
            }
        });
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