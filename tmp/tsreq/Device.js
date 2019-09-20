"use strict";
var Device = (function () {
    // constructor(id:number, name:string) {
    //     this.deviceID = id;
    //     this.name = name;
    // }
    function Device(id, name, type, kind, proto, groups, lastState, isTogg, lastStateStr) {
        this.deviceID = id;
        this.name = name;
        this.deviceType = type;
        this.deviceKind = kind;
        this.proto = proto;
        this.groups = groups;
        this.lastState = lastState;
        this.isToggle = isTogg;
        this.lastStateString = lastStateStr;
        this.unavailable = true;
    }
    Device.prototype.getSendableDevice = function (d) {
        return new Device(d.deviceID, d.name, d.deviceType, d.deviceKind, d.deviceProto, d.groups, d.lastState, d.isToggle, d.lastState ? 'on' : 'off');
    };
    ;
    Device.prototype.setState = function (newState) {
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    };
    ;
    Device.prototype.logEvent = function (eventType, event) {
        var log = {
            time: new Date(),
            deviceID: this.deviceID,
            deviceName: this.name,
            eventType: eventType,
            event: event
        };
        console.log(log);
    };
    return Device;
}());
exports.Device = Device;
