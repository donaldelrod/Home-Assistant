/**
 * @fileoverview NetgearModule class that adds support for Netgear routers
 * @author Donald Elrod
 * @version 1.0.0
*/

const Plugin = require('./Plugin');
const NetgearRouter = require('netgear');

/**
 * Class the represents 
 */
class NetgearModule extends Plugin {

    constructor(details) {
        super();
        this.host = details.host;
        this.username = details.username;
        this.password = details.password;
        this.port = details.port;
        this.netgearRouter = null;
        this.unavailable = true;
        this.details = null;
        this.lastConnectedDevices = null;
        this.Plugins = null;
    }
    
    /**
     * Logs into the Netgear Router and sets up the plugin
     * @param {Object} Plugins the Plugins object from server.js, contains all objects/details for plugins to work properly
     */
    async setup(Plugins) {

        this.Plugins = Plugins;

        this.netgearRouter =  new NetgearRouter(this.password, this.username, this.host, this.port);
        //this.netgearRouter.storedPass = type.details.password;
        //modules.netgearRouter.storedUser = type.details.username;
        //modules.netgearRouter.storedHost = type.details.host;
        //modules.netgearRouter.storedPort = type.details.port;
        
        var loginSuccess = await this.netgearRouter.login(
            this.password, 
            this.username, 
            this.host, 
            this.port
        ).catch( (err) => {
            console.log('Home-Assistant was unable to login to Netgear Router at ' + this.host + ':' + this.port);
            console.log(err);
            this.unavailable = true;
            return false;
        });

        this.unavailable = false;

        if (loginSuccess) {
            this.details = await this.netgearRouter.getInfo();
            console.log('Home-Assistant successfully connected to Netgear router at ' + this.host + ':' + this.port);
            // this.Plugins.PresenceDetectors.push(this);
        }

        // modules.netgearRouter.routerDetails = modules.netgearRouter.discover().then(discovered => {
        //     console.log('Netgear Router connected successfully');
        //     return discovered;
        // }).catch(err => console.log(err));
    }

    async login() {
        var loginSuccess = await this.netgearRouter.login(
            this.password, 
            this.username, 
            this.host, 
            this.port
        ).catch(function (err) {
            console.log('Home-Assistant was unable to login to Netgear Router at ' + this.host + ':' + this.port);
            console.log(err);
            this.unavailable = true;
            return false;
        });

        return loginSuccess
    }

    async getInfo() {
        let loginSuccess = this.login();
        
        let info = null;

        if (loginSuccess) {
            info = await this.netgearRouter.getInfo();
        }

        return info;
        
    }


    /**
     * Queries the router and returns an array of objects that represent a list of devices connected to the router
     * @returns {Object[]} an array of objects, with each object representing one device connected to the router, or null if it cannot connect
     */
    async getAttachedDevices() {
        if (this.unavailable)
            return null;
        var loginSuccess = await this.netgearRouter.login(
            this.password, 
            this.username, 
            this.host, 
            this.port
        ).catch(function (err) {
            console.log('Home-Assistant was unable to login to Netgear Router at ' + this.host + ':' + this.port);
            console.log(err);
            this.unavailable = true;
            return false;
        });
        if (loginSuccess) {
            var attached = await this.netgearRouter.getAttachedDevices();
            this.lastConnectedDevices = attached;
            return attached;
        } else return null;
    }

    /**
     * Implementation of the getPresence function that allows server.js to poll the plugin to get the attached devices
     * @returns {Object[]} list of the devices connected to the router, which are used to check whether specific people are home/near
     */
    async getPresence() {
        let presenceDevices = await this.getAttachedDevices();
        let correctedDevices = [];
        // here we need to correct the field names so it will work properly in the checkWhoIsHome function in server.js
        presenceDevices.forEach((pd) => {
            let cd = {};
            cd.name = pd.Name;
            cd.ip = pd.IP;
            cd.mac = pd.MAC;
            correctedDevices.push(cd);
        });
        return correctedDevices;
    }
}

module.exports = NetgearModule;