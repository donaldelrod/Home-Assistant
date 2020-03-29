/**
 * @fileoverview Modulefile for TPLink devices
 * @author Donald Elrod
 * @version 1.0.0
 */

const Device = require('./Device');
const { Client } = require('tplink-smarthome-api');

const TPClient      = new Client();

/**
 * Class representing a TPLink Device
 * @extends Device
 */
class TPLinkDevice extends Device {

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


    constructor(d) {
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

        this.sysinfo = '';
        this.mac = '';
        this.swVersion = '';
        this.hwVersion = '';
        this.tpid = 0;
        this.tpname = '';
        this.tpmodel = '';
        this.tptype = '';
        this.oemid = '';
        this.alias = '';
        this.supportsDimmer = false;
        this.pollable = true;
        this.unavailable = false;
        
    }

    /**
     * Sets up the device by connecting to the devices and setting up power polling
     * @async
     */
    async setup() {

        // connect to the bulbs
        try {
            if (this.deviceKind === 'TPLink Bulb') {
                this.tplink = TPClient.getBulb({host: this.ip});
            } else if (this.deviceKind === 'TPLink Plug') {
                this.tplink = TPClient.getPlug({host: this.ip});
            }
        } catch (err) {
            // log the error and return false, signaling that the device was not successfully added
            console.log(err);
            this.unavailable = true;
            this.tplink = null;
            return false;
        }

        // another check for failure to add
        if (this.tplink === null)
            return false;
        try {
            this.sysinfo = await this.tplink.getSysInfo()
            .catch( function (err) {
                console.log('found the error');
                console.log(err);
                //this.unavailable = true;
                return false;
            }).finally( (ret) => {
                if (ret === undefined || ret == false) {
                    this.unavailable = true;
                    return false;
                }
            });
        } catch (err) {
            console.log(err); 
            this.sysinfo = null;
            return null;
        }
        
        //if null, device isn't currently connected
        if (this.sysinfo === null)
            return false;
        
        //get device state every 5 seconds
        await this.tplink.startPolling(5000);

        this.tplink.on('power-on', () => {
            this.lastState = true;
            this.lastStateString = 'on';
            this.logEvent('power-status', 'on');
        });
        this.tplink.on('power-off', () => {
            this.lastState = false;
            this.lastStateString = 'off';
            this.logEvent('power-status', 'off');
        });

        this.mac            = this.sysinfo.mac;
        this.tpalias        = this.sysinfo.alias;
        this.oemid          = this.sysinfo.oemId;
        this.tpmodel        = this.sysinfo.model;
        this.tpid           = this.sysinfo.deviceId;
        this.tptype         = this.sysinfo.type;
        this.hwVersion      = this.sysinfo.hw_ver;
        this.swVersion      = this.sysinfo.sw_ver;
        this.tpname         = this.sysinfo.dev_name;
        this.supportsDimmer = this.sysinfo.brightness != null;
        this.unavailable    = false;

        return true;
    }

    /**
     * Sets the state of this TPLink device
     * @async
     * @param {boolean} newState the state to set the device to
     * @returns {Object} sendable representation of TPLinkDevice object
     */
    async setState(newState) {
        let power_state;
        if (newState === undefined)
            power_state = !this.tplink.relayState;
        else 
            power_state = newState;
        
        let newPowerState = await this.tplink.setPowerState(power_state);
        this.lastState = newPowerState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this.getSendableDevice();
    }

    /**
     * Toggles the state of the TPLink device
     * @async
     * @returns {Object} sendable representation of TPLinkDevice object
     */
    async toggleState() {
        let power_state = !this.tplink.relayState;

        let newPowerState = await this.tplink.setPowerState(power_state);
        this.lastState = newPowerState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        this.logEvent('power-status', this.lastStateString)

        return this.getSendableDevice();
    }

    /**
     * Returns the current state of the TPLink device
     * @returns {boolean} the last state of the TPLink device
     */
    async getDeviceState() {
        return this.tplink.relayState;
    }

    /**
     * Returns a TPLinkDevice as an object expected in the frontend
     * @returns {Object} sendable representation of TPLinkDevice object
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
            ip:             this.ip,
            roomID:         this.roomID,
            roomName:       this.roomName,
            mac:            this.mac,
            swVersion:      this.swVersion,
            hwVersion:      this.hwVersion,
            tpid:           this.tpid,
            tpname:         this.tpname,
            tpmomdel:       this.tpmodel,
            tptype:         this.tptype,
            oemid:          this.oemid,
            alais:          this.alias,
            supportsDimmer: this.supportsDimmer
        }
    }

    /**
     * Logs events, such as changes in state
     * @param {string} eventType a string representing the type of Event
     * @param {Object} event a collection of event information, will eventually be standardized
     */
    logEvent(eventType, event) {
        super.logEvent(eventType, event);
    }

    
}

module.exports = TPLinkDevice;