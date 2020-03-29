var express = require('express');
var router = express.Router();

let globals = require('../globals.js');


//---------------------------------------------Proxmox API

/**
 * @api {get} /api/prox/nodes GetProxNodes
 * @apiName GetProxNodes
 * @apiGroup Proxmox
 * @apiVersion  0.1.0
 * @apiDescription Returns an array of nodes that the Proxmox server is aware of
 * 
 * @apiSuccess (200) {Object[]} nodes an array of nodes in the Proxmox server
 * @apiUse authToken
 */
router.route('/nodes').get(async (req, res) => {

    var nodes = await prox_tools.getNodes(modules.prox);
    res.json(nodes);
});

/**
 * @api {get} /api/prox/cluster GetProxCluster
 * @apiName GetProxCluster
 * @apiGroup Proxmox
 * @apiVersion  0.1.0
 * @apiDescription Returns an array of clusters that the Proxmox server is aware of
 * 
 * @apiSuccess (200) {Object[]} nodes an array of clusters in the Proxmox server
 * @apiUse authToken
 */
router.route('/cluster').get(async (req, res) => {

    var clusterStatus = await prox_tools.getClusterStatus(modules.prox);
    res.json(clusterStatus);
});

module.exports = router;