/**
 * @fileoverview Device Module for a Harmony Hub
 * @author Donald Elrod
 * @version 1.0.0
*/

const Device        = require('./Device');
const HarmonyDevice = require('./HarmonyDevice');

var harmony         = require('harmonyhubjs-client');

/**
 * Class representing a Harmony Hub, which is responsible for communicating with devices controlled by the Hub
 * @extends Device
 */
class HarmonyHubDevice extends Device {

    constructor(d) {
        super(
            d.deviceID, 
            d.name, 
            d.deviceType, 
            d.deviceKind, 
            d.proto,
            d.groups, 
            d.lastState, 
            false, 
            d.lastStateString,
            d.ip,
            d.roomID,
            d.roomName
        );

        this.children = [];
        this.hub = {};

        this.pollable = false;
        this.unavailable = true;

    }

    /**
     * Connects to the Harmony Hub, and creates HarmonyDevice objects for each device that the hub controlls. HarmonyDevices are added to the device array from the main program
     * @async
     * @param {Device[]} devices the array of all devices controlled by Home Assistant, from server.js
     */
    async setup(devices) {
        
        try {
            let hub = await harmony(this.ip)

            this.hub = hub;
            // gets all the devices connected to the hub
            let rawCommands = await hub.getAvailableCommands();

            this.processRawDevices(rawCommands, devices.length);

            // this.children.forEach((childDevice) => {
            for (const childDevice of this.children) {
                var inDevices = false;
                devices.forEach(function(d) {
                    if (d.name === childDevice.name)
                        inDevices = true;
                });
                // only push to devices to main device list if the device is new, so harmony devices can be stored and further customized in the program
                // devices are saved to devices.json after being added once
                if (!inDevices) {
                    devices.push(childDevice);
                    console.log('Harmony Hub added ' + childDevice.name + ' to Home Assistant');
                }
            }
            
            this.unavailable = false;
            return true;
        }
        catch (err) {
            console.log(err);
            console.log("unable to connect to harmony hub");
            this.unavailable = true;
            return false;
        }
    }

    processRawDevices(rawCommands, startID) {
        // this loops through each device and creates a new Device object
        // rawCommands.device.forEach( (rawDevice) => {
        for (const rawDevice of rawCommands.device) {
            let t = new Device(
                startID,                        //deviceID
                rawDevice.label,                //name
                rawDevice.type,                 //deviceType
                'Harmony - ' + rawDevice.type,  //deviceKind
                'HarmonyDevice',                //deviceProto
                ['harmony'],                    //groups
                false,                          //lastState
                true,                           //isToggle
                'off',                          //lastStateString
                "",                             //ip
                this.roomID,                    //room
                this.roomName
            );

            startID++;

            let tempDevice = new HarmonyDevice(
                t, 
                {
                    controlPort: rawDevice.ControlPort,
                    manufacturer: rawDevice.manufacturer,
                    harmonyProfile: rawDevice.deviceProfileUri,
                    deviceModel: rawDevice.model,
                    isManualPower: rawDevice.isManualPower,
                    controlGroups: [],
                    controller: this
                }
            );
            
            // this loop goes through each control group, i.e. Power, Volume, etc., and adds all the functions in each control group to the HarmonyDevice's command list
            // rawDevice.controlGroup.forEach(function(cg) {
            for (const cg of rawDevice.controlGroup) {
                let tempCG = {
                    name: cg.name,
                    controls: []
                };
                // cg.function.forEach(function(ctrl) {
                for (const ctrl of cg.function) {
                    tempCG.controls.push({
                        name: ctrl.name,
                        command: ctrl.action,
                        formattedCommand: ctrl.action.replace(/\:/g, '::')
                    });
                }
                tempDevice.controlGroups.push(tempCG);
            }
            // push devices to hubs list and device list
            this.children.push(tempDevice);
            //devices.push(tempDevice);
            
            // var inDevices = false;
            // devices.forEach(function(d) {
            //     if (d.name === tempDevice.name)
            //         inDevices = true;
            // });
            // // only push to devices if the device is new, so harmony devices can be stored and further customized in the program devices are saved to devices.json after being added once
            // if (!inDevices) {
            //     devices.push(tempDevice);
            // }
                
        }
    }

    /**
     * Sets the state of the HarmonyHub. Currently, this is a dummy function, but might make it to power down all devices that it controls in the future
     * @async
     * @param {boolean} newState the state to set the device to
     * @returns {Object} returns this object as a sendable device, with the updated state
     */
    async setState(newState) {

        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this.getSendableDevice();
    }

    /**
     * Sends the formatted command to the connected Harmony Hub
     * @param {Object} modules modules object from server.js
     * @param {string} formattedCommand Harmony-specific command string, tells the hub what button to emulate
     */
    sendHarmonyCommand(formattedCommand) {
        this.hub.send('holdAction', 'action=' + formattedCommand + ':status=press');
    }

    /**
     * Returns the current state of the device, however as this specific device does not have a state other than on, it will always return true
     */
    getDeviceState() {
        return true;
    }

    /**
     * Returns this HarmonyHubDevice as an object expected in the frontend
     * @returns {Object} sendable representation of HarmonyHubDevice object
     */
    getSendableDevice() {
        // sendable children
        let sc = [];
        this.children.forEach(function(c) {
            sc.push(c.getSendableDevice());
        });

        return {
            deviceID:       this.deviceID, 
            name:           this.name, 
            deviceType:     this.deviceType, 
            deviceKind:     this.deviceKind, 
            deviceProto:    this.deviceProto, 
            groups:         this.groups, 
            lastState:      this.lastState, 
            isToggle:       this.isToggle, 
            lastStateString:this.lastStateString,
            ip:             this.ip,
            roomID:         this.roomID,
            roomName:       this.roomName
            // children:       sc
        }    
    }

    
}

module.exports = HarmonyHubDevice;