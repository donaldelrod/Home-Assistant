var express = require('express');
var router = express.Router();

//let globals = require('../globals.js');

let os = require('os');


//-------------------------------Stats and Performance API

/**
 * @api {get} /api/metrics/me/cpu GetServerCPUMetrics
 * @apiDescription Returns the computer running the server's CPU metrics
 * @apiName GetServerCPUMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} CPUMetrics returns the metrics of each cpu core of the server
 * @apiUse authToken
 */
router.route('/me/cpu').get((req, res) => {

    res.json(os.cpus());
});

/**
 * @api {get} /api/metrics/me/mem GetServerMemMetrics
 * @apiDescription Returns the computer running the server's memory metrics
 * @apiName GetServerMemMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} MemMetrics returns the metrics of the server's memory
 * @apiUse authToken
 */
router.route('/me/mem').get((req, res) => {

    var tmem = os.totalmem();
    var fmem = os.freemem();
    var umem = tmem - fmem;
    var mem = {
        totalmem: tmem,
        freemem: fmem,
        usedmem: umem
    }
    res.json(mem);
});

/**
 * @api {get} /api/metrics/me/load GetServerCPULoadMetrics
 * @apiDescription Returns the computer running the server's CPU load metrics
 * @apiName GetServerCPULoadMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} CPULoadMetrics returns the metrics of the avaerage load of the server
 * @apiUse authToken
 */
router.route('/me/load').get((req, res) => {

    res.json({load: os.loadavg()});
});

/**
 * @api {get} /api/metrics/me/network GetServerNetworkInterfaces
 * @apiDescription Returns the computer running the server's network interfaces
 * @apiName GetServerNetworkInterfaces
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} NetworkInterfaces returns the network interfaces of the server
 * @apiUse authToken
 */
router.route('/me/network').get((req, res) => {

    res.json(os.networkInterfaces());
});

/**
 * @api {get} /api/metrics/me/all GetAllServerMetrics
 * @apiDescription Returns the full spectrum of metrics about the computer running the server
 * @apiName GetAllServerMetrics
 * @apiGroup Metrics
 * @apiVersion 0.1.0
 * 
 * @apiSuccess (200) {Object} AllMetrics returns all available metrics about the computer running the server
 * @apiUse authToken
 */
router.route('/me/all').get((req, res) => {

    var tmem = os.totalmem();
    var fmem = os.freemem();
    var umem = tmem - fmem;
    var mem = {
        totalmem: tmem,
        freemem: fmem,
        usedmem: umem
    }

    var cpus        = os.cpus();
    var ni          = os.networkInterfaces();
    var load        = os.loadavg();
    var end         = os.endianness();
    var platform    = os.platform();
    var arch        = os.arch();
    var uptime      = os.uptime();

    var stats = {
        platform: platform,
        arch: arch,
        endianness: end,
        cpus: cpus,
        memory: mem,
        networkInterfaces: ni,
        loadavg: load,
        uptime: uptime
    }

    res.json(stats);
});

module.exports = router;