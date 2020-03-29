/**
 * @fileoverview Modulefile for Hue devices, which is a sort of a child module to the HueHubDevice module
 * @author Donald Elrod
 * @version 1.0.0
 */

const Device = require('./Device');

/**
 * Class representing a Hue Device, which is controlled via the HueHubDevice
 * @extends Device
 */
class HueDevice extends Device {
    //ts file in angular folder
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
            d.lastStateString,
            d.ip,
            d.roomID,
            d.roomName
        );

        this.manufacturer   = options.manufacturer;
        this.model          = options.model;
        this.capabilities   = options.capabilities;
        this.config         = options.config;
        this.uid            = options.uid;
        this.swVersion      = options.swVersion;
        this.state          = options.state;
        this.hueID          = options.hueID;

        this.controller     = options.controller;

        this.pollable = true;
        this.unavailable = false;
    }
    
    /**
     * Returns HueDevice object expected in the frontend
     * @returns {Object} sendable representation of HueDevice object
     */
    getSendableDevice() {
        return {
            deviceID:           this.deviceID, 
            name:               this.name,
            deviceType:         this.deviceType, 
            deviceKind:         this.deviceKind, 
            deviceProto:        this.deviceProto, 
            groups:             this.groups, 
            lastState:          this.lastState, 
            isToggle:           this.isToggle, 
            lastStateString:    this.lastStateString,
            manufacturer:       this.manufacturer,
            model:              this.model,
            uid:                this.uid,
            swVersion:          this.swVersion,
            hueID:              this.hueID,
            roomID:             this.roomID,
            roomName:           this.roomName
        };
    }

    /**
     * Sets the state of this Hue device
     * @async
     * @param {boolean} newState the state to set the light to
     * @returns {Object} sendable representation of HueDevice object
     */
    async setState(newState) {
        this.controller.setLightState(this.hueID, newState);
        
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        
        return this.getSendableDevice();
    }

    /**
     * Toggles the state of the Hue device
     * @async
     * @returns {Object} sendable representation of HueDevice object
     */
    async toggleState() {
        
        this.controller.setLightState(this.hueID, !this.lastState);
        this.lastState = !this.lastState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        return this.getSendableDevice();
    }

    /**
     * Returns the current state of the Hue light
     * @returns {boolean} the last state of all known Hue lights attached
     */
    getDeviceState() {
        return this.lastState;
    }

    /**
     * Logs events, such as changes in state
     * @param {string} eventType a string representing the type of Event
     * @param {Object} event a collection of event information, will eventually be standardized
     */
    logEvent(eventType, event) {
        let log = {
            time: new Date(),
            deviceID: this.deviceID,
            deviceName: this.name,
            eventType: eventType,
            event: event
        };
        console.log(log);
    }
}

module.exports = HueDevice;