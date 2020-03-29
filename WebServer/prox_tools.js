/**
 * @fileoverview Collection of functions that deal with connecting to/controlling a server running Proxmox
 * @author Donald Elrod
 * @version 1.0.0
 */
var proxmox         = require('proxmox');
/**
 * Collection of functions that deal with connecting to/controlling a server running Proxmox
 * @exports prox_tools
 */
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
    getClusterStatus: async function(prox) {
        return new Promise(function(resolve, reject) {
            prox.getClusterStatus(function(err, response){
                if(err) {
                    console.log(err);
                    reject(err);
                }
                else {
                  data = JSON.parse(response);
                  console.log(data);
                  resolve(data);
                }
            });
        });
    },
    getNodes: async function(prox) {
        return new Promise(function(resolve, reject) {
            prox.getNodes(function(err, response){
                if(err) {
                    console.log(err);
                    reject(err);
                }
                else {
                  data = JSON.parse(response);
                  console.log(data);
                  resolve(data);
                }
            });
        });
    }
};