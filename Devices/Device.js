/**
 * @fileoverview Device class for plugins to extend
 * @author Donald Elrod
 * @version 1.0.0
*/

/**
 * Class representing a generic Device, which can be extended to allow new types of Devices to be implemented
 */
class Device {
    //ts file in angular folder
    constructor(id, name, type, kind, proto, groups, lastState, isTogg, lastStateStr, ip) {
        this.deviceID       = id;
        this.name           = name;
        this.deviceType     = type;
        this.deviceKind     = kind;
        this.deviceProto    = proto;
        this.groups         = groups;
        this.lastState      = lastState;
        this.isToggle       = isTogg;
        this.lastStateString = lastStateStr;
        this.ip             = ip;
        
        this.unavailable    = true;
    }

    /**
     * This class provides an interface to allow devices to run setup after being created. This is useful for when devices must connect to a hub, or if other devices need to act on this one
     */
    setup() {}
    
    /**
     * Returns Device object expected in the frontend
     * @returns {Object} sendable representation of the Device object
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
            lastStateString:    this.lastStateString
        };
    };

    /**
     * Interface function to set the state of this device
     * @async
     * @param {boolean} newState the state to set the light to
     * @returns {Object} sendable representation of the Device object
     */
    async setState(newState) {
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    };

    /**
     * Interface function to toggle the state of the device
     * @async
     * @returns {Device} returns the Device object
     */
    async toggleState() {
        this.lastState = !this.lastState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    }

    /**
     * Interface function to get the state of the Device
     * @returns {boolean} the current state of the device
     */
    getDeviceState() {
        return this.lastState;
    }

    /**
     * Logs events, eventually events will be logged to an Influx database for analysis
     * @param {string} eventType description of the event type to log
     * @param {string/Object} event description or dump of the event details
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


module.exports = Device;