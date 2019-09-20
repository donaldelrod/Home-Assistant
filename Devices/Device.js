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

    setup() {}
    
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

    async setState(newState) {
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    };

    async toggleState() {
        this.lastState = !this.lastState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    }

    getDeviceState() {
        return this.lastState;
    }

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