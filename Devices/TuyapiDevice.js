/**
 * @fileoverview Device Module for Tuyapi devices
 * @author Donald Elrod
 * @version 1.0.0
*/

const Device        = require('./Device');
const TuyAPI        = require('tuyapi');

class TuyapiDevice extends Device {

    static get [Symbol.species]() { return Device; }


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

    async setup() {
    
    }

    async setState(newState) {
        
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this;
    }

    getDeviceState() {
        return this.lastState;
    }

    getSendableDevice() {
        super.getSendableDevice();
    }

    
}

module.exports = TuyapiDevice;