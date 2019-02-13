var proxmox         = require('proxmox');
module.exports = {
    /**
     * Processes the activation of the Proxmox module
     * @param {*} modules the modules object from server.js, contains all objects/details for modules to work properly
     * @param {*} type the Netgear object loaded from the modules.json file (this is obtained during the initial forEach loop in the processModules function in server.js)
     */
    processProxmox: function (modules, type) {
        try {
            modules.prox = proxmox(type.details.user, type.details.password, type.details.ip);
            console.log('Proxmox api enabled');
        } catch(err) {
            console.log(err);
        }    
    },
    getClusterStatus: function(prox) {
        prox.getClusterStatus(function(err, response){
            if(err) throw err;
            else{
              data = JSON.parse(response);
              console.log(data);
            }
        });
    }
};