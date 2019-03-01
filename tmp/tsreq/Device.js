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
    }
    Device.prototype.getSendableDevice = function (d) {
        return new Device(d.deviceID, d.name, d.deviceType, d.deviceKind, d.deviceProto, d.groups, d.lastState, d.isToggle, d.lastState ? 'on' : 'off');
    };
    ;
    Device.prototype.setState = function (newState) {
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this.lastState;
    };
    return Device;
}());
exports.Device = Device;
