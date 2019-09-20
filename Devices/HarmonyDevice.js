/**
 * @fileoverview Device Module for devices controlled by a Harmony Hub
 * @author Donald Elrod
 * @version 1.0.0
*/

const Device        = require('./Device');

var harmony         = require('harmonyhubjs-client');

const hub = {};


class HarmonyDevice extends Device {

    // tplink;         //:        any;
    // sysinfo;        //:        any;
    // mac;            //:        string;
    // swVersion;      //:        string;
    // hwVersion;      //:        string;

    // tpid;           //:       number;
    // tpname;         //:     string;
    // tpmodel;        //:    string;
    // tpdesc;         //:     string;
    // tptype;         //:     string;

    // supportsDimmer; //: boolean;


    constructor(d, options) {
        super(
            d.deviceID, 
            d.name, 
            d.deviceType, 
            d.deviceKind, 
            d.proto, 
            d.groups, 
            d.lastState, 
            d.isToggle, 
            d.lastStateString
        );

        this.controlPort    = d.controlPort;
        this.manufacturer   = d.manufacturer;
        this.harmonyProfile = d.harmonyProfile;
        this.deviceModel    = d.deviceModel;
        this.isManualPower  = d.isManualPower;
        this.controlGroups  = d.controlGroups;
        this.belongsToHub   = d.belongsToHub;
        this.hubInd         = d.hubInd;

        hub = options;

    }

    async setup() {
    
    }

    async setState(newState) {
        let power_state;

        
        this.lastState = newPowerState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this;
    }

    /**
     * Sends the formatted command to the connected Harmony Hub
     * @param {Object} modules modules object from server.js
     * @param {string} formattedCommand Harmony-specific command string, tells the hub what button to emulate
     */
    sendHarmonyCommand(formattedCommand) {
        hub.send('holdAction', 'action=' + formattedCommand + ':status=press');
    }

    getDeviceState() {
        return this.lastState;
    }

    
}

module.exports = HarmonyDevice;