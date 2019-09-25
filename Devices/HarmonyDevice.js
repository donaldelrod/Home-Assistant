/**
 * @fileoverview Device Module for devices controlled by a Harmony Hub
 * @author Donald Elrod
 * @version 1.0.0
*/

const Device        = require('./Device');

//var harmony         = require('harmonyhubjs-client');

/**
 * Class representing a device controlled by a Harmony Hub
 * @extends Device
 */
class HarmonyDevice extends Device {


    constructor(d, options) {
        super(
            d.deviceID, 
            d.name, 
            d.deviceType, 
            d.deviceKind, 
            d.deviceProto, 
            d.groups, 
            d.lastState, 
            d.isToggle, 
            d.lastStateString
        );

        this.controlPort    = options.controlPort;
        this.manufacturer   = options.manufacturer;
        this.harmonyProfile = options.harmonyProfile;
        this.deviceModel    = options.deviceModel;
        this.isManualPower  = options.isManualPower;
        this.controlGroups  = options.controlGroups;
        this.controller   = options.controller;

        //hub = options;

    }

    /**
     * Sets up the HarmonyDevice for use with HarmonyHubDevice
     * @async
     */
    async setup() {
    
    }

    /**
     * Sets the state of this Harmony device
     * @async
     * @param {boolean} newState the state to set the light to
     * @returns {Object} sendable representation of HarmonyDevice object
     */
    async setState(newState) {

        let control = "PowerOff";

        if (newState === true)
            control = "PowerOn"

        let command = this.getHarmonyControl('Power', control);

        if (command === undefined) {
            console.log('cannot toggle the power state of this device');
            return;
        }

        this.controller.sendHarmonyCommand(command.formattedCommand);
        
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this;
    }

    /**
     * Finds the specific Harmony control for the given input
     * @param {Object} modules modules object from server.js
     * @param {string} deviceName the name of the device to get the controls for
     * @param {string} controlGroup the control group of the control, i.e. 'Power'
     * @param {string} control the specific control, i.e. 'VolumeUp'
     * @returns {Object} the object for the specified control
     */
    getHarmonyControl (controlGroup, control) {
        
        var selectedCG = this.controlGroups.find((cg) => {
                return cg.name === controlGroup;
        });
        if (selectedCG === undefined)
            return undefined;
        var selectedControl = selectedCG.controls.find((thisControl) => {
            return thisControl.name === control;
        });
        return selectedControl;
    }

    /**
     * Returns the last known state of the HarmonyDevice
     * @returns {boolean} the last known state of the HarmonyDevice
     */
    getDeviceState() {
        return this.lastState;
    }

    /**
     * Returns HarmonyDevice object expected in the frontend
     * @returns {Object} sendable representation of HarmonyDevice object
     */
    getSendableDevice() {
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
            ip:             this.ip
        }    
    }

    
}

module.exports = HarmonyDevice;