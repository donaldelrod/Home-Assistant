"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Device_1 = require('./Device');
var Control = (function () {
    function Control() {
    }
    return Control;
}());
var ControlGroup = (function () {
    function ControlGroup() {
    }
    return ControlGroup;
}());
var HarmonyDevice = (function (_super) {
    __extends(HarmonyDevice, _super);
    function HarmonyDevice(d, cg, man, haProf, devMod, isManPow, hub, hubInd) {
        _super.call(this, d.deviceID, d.name, d.deviceType, d.deviceKind, d.proto, d.groups, d.lastState, d.isToggle, d.lastStateString);
        this.controlGroups = cg;
        this.manufacturer = man;
        this.harmonyProfile = haProf;
        this.deviceModel = devMod;
        this.isManualPower = isManPow;
        this.belongsToHub = hub;
        this.hubInd = hubInd;
    }
    return HarmonyDevice;
}(Device_1.Device));
exports.HarmonyDevice = HarmonyDevice;
