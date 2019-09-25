var devices             = [];
var profiles            = [];
var activities          = [];
var config              = {};
let modules             = {};
let scheduledFunctions  = [];
let DeviceModules       = [];
let PluginModules       = [];

exports.devices = devices;
exports.profiles = profiles;
exports.getProfiles = function() {
    return profiles;
}
exports.setProfiles = function(newProfiles) {
    profiles = newProfiles;
}
exports.activities = activities;
exports.config = config;
exports.getConfig = function() {
    return config;
}
exports.setConfig = function(newConfig) {
    config = newConfig;
}
exports.modules = modules;
exports.scheduledFunctions = scheduledFunctions;
exports.DeviceModules = DeviceModules;
exports.PluginModules = PluginModules;