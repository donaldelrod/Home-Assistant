/**
 * @fileoverview Modulefile for the Hue Hub, which is a sort of parent module to the HueDevice module
 * @author Donald Elrod
 * @version 1.0.0
 */

const Device = require('./Device');
const HueDevice = require('./HueDevice')

let api_tools = require('../api_tools.js');


/**
 * Class representing a Hue Hub Device, which controls an array of HueDevices
 * @extends Device
 */
class HueHubDevice extends Device {
    //ts file in angular folder
    constructor(d, options) {
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

        this.username = options.username;

        this.lights = [];

    }
    
    /**
     * Returns HueHubDevice object expected in the frontend
     * @returns {Object} sendable representation of HueHubDevice object
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
            lastStateString:    this.lastStateString,
            ip:                 this.ip,
            roomID:             this.roomID,
            roomName:           this.roomName
        };
    };

    /**
     * Sets the state of all Hue devices connected
     * @async
     * @param {boolean} newState the state to set the lights to
     * @returns {Object} sendable representation of HueHubDevice object
     */
    async setState(newState) {

        this.lights.forEach( (light) => {
            this.setLightState(light.hueID, newState);
        });
        
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        
        return this;
    };

    /**
     * Toggles the state of all Hue devices connected
     * @async
     * @returns {Object} sendable representation of HueHubDevice object
     */
    async toggleState() {

        this.lights.forEach( (light) => {
            this.setLightState(light.hueID, !this.lastState);
        });
        
        this.lastState = !this.lastState;
        this.lastStateString = this.lastState ? 'on' : 'off';

        return this;
    }

    /**
     * Returns the last state of all known Hue lights attached.
     * This does not poll the Hue lights
     * @returns {boolean} the last state of all known Hue lights attached
     */
    getDeviceState() {
        return this.lastState;
    }

    /**
     * Logs events, such as changes in state
     * @param {string} eventType a string representing the type of Event
     * @param {Object} event a collection of event information, will eventually be standardized
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


    /**
    * Processes Hue lighting by connecting to the bridge and downloading connected device list
    * @async
    * @param {Object[]} devices devices array from the main script, will add harmony devices to the array
    */
    async setup(devices) {
        //bridge_user = this.username;
        try {
            var hueDevices = await this.getAllLights();
            if (hueDevices === null) {
                console.log('Home-Assistant was unable to connect to Hue Bridge at ' + this.ip + ':80');
                return;
            }
            var i = 1;
            while(hueDevices[''+i] !== undefined) {
                var hueDevice = hueDevices[''+i];
                let t = new Device(
                    devices.length,                     //deviceID
                    hueDevice.name,                     //name
                    hueDevice.type,                     //deviceType
                    hueDevice.productid,                //deviceKind
                    'HueDevice',                        //deviceProto
                    ['lights','hue'],                   //groups
                    hueDevice.state.on,                 //lastState
                    true,                               //isToggle
                    hueDevice.state.on ? 'on' : 'off',  //lastStateString
                    this.ip,                            //ip
                    this.room                           //room
                );
                var tempDevice = new HueDevice(
                    t,
                    {
                        manufacturer: hueDevice.manufacturername,
                        model: hueDevice.modelid, //model
                        capabilities: hueDevice.capabilities,
                        config: hueDevice.config,
                        uid: hueDevice.uniqueid,
                        swVersion: hueDevice.swversion,
                        state: hueDevice.state,
                        hueID: i,
                        controller: this
                    }
                );

                devices.push(tempDevice);
                this.lights.push(tempDevice);

                i++;
            }
            console.log('Hue lights connected successfully')
        } catch (err) {
            console.log(err);
        }
   }

       /**
     * Retrieves a list of all Hue devices connected to the Hue Bridge
     * @async
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @returns {Object} Object containing all connected Hue devices
     */
    async getAllLights() {

        var baseHost = 'http://' + this.ip;
        var basePath = '/api/' + this.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights';

        var lights = await api_tools.getRestHttp(url);
        return lights;
    }


    /**
     * Gets information about a specific Hue device
     * @async
     * @param {number} lightID the id of a Hue light
     * @returns {Object} returns the specified light as a JSON object
     */
    async getLight (lightID) {

        var baseHost = 'http://' + this.ip;
        var basePath = '/api/' + this.username;
        var baseURL = baseHost + basePath;
        var url = baseURL + '/lights/' + lightID;
        var light = await api_tools.getRestHttp(url);
        return light;
    }


    /**
     * Sets the on/off state of a Hue light
     * @async
     * @param {number} lightID the Hue ID of a Hue light
     * @param {boolean} state the state to set the light to
     */
    async setLightState(lightID, state) {
            
        var baseHost = this.ip;
        var basePath = '/api/' + this.username;
        var path = basePath + '/lights/' + lightID + '/state';
        var body =  JSON.stringify({on:state});
        api_tools.putRestHttp(baseHost, path, body)
            .catch(reason => console.log(reason));
    }
}


module.exports = HueHubDevice;