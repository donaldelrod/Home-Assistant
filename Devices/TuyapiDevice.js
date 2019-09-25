/**
 * @fileoverview Device Module for Tuyapi devices
 * @author Donald Elrod
 * @version 1.0.0
*/

const Device        = require('./Device');
const TuyAPI        = require('tuyapi');

/**
 * Device module allowing HA to control Tuyapi Devices
 */
class TuyapiDevice extends Device {

    //static get [Symbol.species]() { return Device; }


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

        this.tuyapi = new TuyAPI({
            id: d.options.id,
            key: d.options.key,
            ip: d.ip
        });
    }

    /**
     * Performs setup functions for the device
     * @async
     */
    async setup() {
    
    }

    /**
     * Sets the state of the TuyapiDevice
     * @async
     * @param {boolean} newState state to set the device to
     * @returns {TuyapiDevice} returns this device after changing the state
     */
    async setState(newState) {
        
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this;
    }

    /**
     * Gets the current state of the TuyapiDevice
     * @returns {boolean} the current state of the device
     */
    getDeviceState() {
        return this.lastState;
    }

    /**
     * Returns TuyapiDevice object expected in the frontend
     * @returns {Object} sendable representation of the Device object
     */
    getSendableDevice() {
        super.getSendableDevice();
    }

    
}

module.exports = TuyapiDevice;