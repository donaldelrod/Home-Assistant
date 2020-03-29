var program = require('commander');
var hap = require("hap-nodejs");
//var version = require('./node_modules/homebridge/lib/version');
var Server = require('homebridge/lib/server').Server;
var Plugin = require('homebridge/lib/plugin').Plugin;
var User = require('homebridge/lib/user').User;
var log = require("homebridge/lib/logger")._system;


module.exports = function() {

    var cleanCachedAccessories = false
    var insecureAccess = false;
    var hideQRCode = false;
    var shuttingDown = false;

    User.setStoragePath('./config/homebridge/');

    hap.init(User.persistPath());

    let server = new Server({
        cleanCachedAccessories:cleanCachedAccessories, 
        insecureAccess:insecureAccess, 
        hideQRCode:hideQRCode
    });

    let homebridge = server._api;

    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    
    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-homeassistant", "HomeBridgePlatform", HomeBridgePlatform, true);
}

class HomeBridgePlatform {

    constructor(log, config, api) {
        this.Accessory = null;
        this.Service = null;
        this.Characteristic = null;
        this.UUIDGen = null;

        console.log("HomeBridgePlatform init");
        log("HomeBridgePlatform init");
        var platform = this;
        
        this.log = log;
        this.config = config;
        this.accessories = [];

        if (api) {
            this.api = api;
            this.api.on('didFinishLaunching', function() {
                platform.log('DidFinishLaunching');
            }.bind(this));
        }
        
    }

    configureAccessory(accessory) {
        this.log(accessory.displayName, "Configure Accessory");
        var platform = this;

        accessory.reachable = true;

        accessory.on('identift', function(paired, callback) {
            platform.log(accessory.displayName, "Identify!!");
            callback();
        });

        if (accessory.getService(Service.Lightbulb)) {
            accessory.getService(Service.Lightbulb)
             .getCharacteristic(Characteristic.On)
             .on('set', function(value, callback) {
                 platform.log(accessory.displayName, "Light -> " + value);
                 callback();
             });
        }

        this.accessories.push(accessory);
    }

}