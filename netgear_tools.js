const NetgearRouter = require('netgear');

module.exports = {
    /**
     * Logs into the Netgear Router with the information located in the modules.json file
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @param {Object} type the Netgear object loaded from the modules.json file (this is obtained during the initial forEach loop in the processModules function in server.js)
     */
    processNetgearRouter: function(modules, type) {
        modules.netgearRouter =  new NetgearRouter(type.details.password, type.details.username, type.details.host, type.details.port);
        modules.netgearRouter.storedPass = type.details.password;
        modules.netgearRouter.storedUser = type.details.username;
        modules.netgearRouter.storedHost = type.details.host;
        modules.netgearRouter.storedPort = type.details.port;
        
        modules.netgearRouter.routerDetails = modules.netgearRouter.discover().then(discovered => {
            console.log('Netgear Router connected successfully');
            return discovered;
        }).catch(err => console.log(err));
    },
    /**
     * Queries the router and returns an array of objects that represent a list of devices connected to the router
     * @param {Object} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @returns {Object[]} an array of objects, with each object representing one device connected to the router
     */
    getAttachedDevices: async function(modules) {
        var loginSuccess = await modules.netgearRouter.login(
            modules.netgearRouter.storedPass, 
            modules.netgearRouter.storedUser, 
            modules.netgearRouter.storedHost, 
            modules.netgearRouter.storedPort
        );
        if (loginSuccess) {
            var attached = await modules.netgearRouter.getAttachedDevices();
            modules.netgearRouter.lastConnectedDevices = attached;
            return attached;
        }
    }
}    