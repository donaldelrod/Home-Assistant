var express = require('express');
// var router = express.Router();

// let globals = require('../globals.js');
// let modules = globals.modules;
//var netgear_tools   = require('../netgear_tools.js');


//------------------------------------Netgear API
class NetgearRouter {
    constructor(NetgearModule) {
        this.router = express.Router();
        this.NetgearModule = NetgearModule;
        this.setupRouting();
    }

    setupRouting() {
        /**
         * @api {get} /api/netgearrouter/attached GetNetgearAttachedDevices
         * @apiDescription Returns all the devices connected to the Linked Netgear router
         * @apiName GetNetgearAttachedDevices
         * @apiGroup Netgear
         * @apiVersion 0.1.0
         * 
         * @apiSuccess (200) {Object[]} attachedDevices returns an array of attached devices
         * @apiUse authToken
         */
        this.router.route('/attached').get(async (req, res) => {

            var attachedDevices = await this.NetgearModule.getAttachedDevices();
            res.send(attachedDevices);
        });

        /**
         * @api {get} /api/netgearrouter/info GetNetgearAttributes
         * @apiDescription Returns info about the Netgear router
         * @apiName GetNetgearAttributes
         * @apiGroup Netgear
         * @apiVersion 0.1.0
         * 
         * @apiSuccess (200) {Object[]} netgearInfo returns object with Netgear router attributes
         * @apiUse authToken
         */
        this.router.route('/info').get(async (req, res) => {

            let info = await this.NetgearModule.getInfo();

            res.json(info);

            // modules.netgearRouter.login(modules.netgearRouter.storedPass, modules.netgearRouter.storedUser, modules.netgearRouter.storedHost, modules.netgearRouter.storedPort).then(function(successfulLogin) {
            //     if (successfulLogin) {
            //         modules.netgearRouter.getInfo().then(function(info) {
            //             res.send(info);
            //         });
            //     }
            // });
        });
    }

    getRouter() {
        return this.router;
    }

}


module.exports = function (NetgearModule) {
    let nm = new NetgearRouter(NetgearModule);
    return nm.getRouter();
};