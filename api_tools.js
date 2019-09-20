/**
 * @fileoverview Collection of functions that deal with API calls, mostly REST related
 * @author Donald Elrod
 * @version 1.0.0
 */


var http = require('http');
var https = require('https');
//var file_tools = require('./file_tools.js');
var Stream = require('stream').Transform;

/**
 * Collection of functions that deal with API calls, mostly REST related
 * @exports api_tools
 */
module.exports = {
    /**
     * Returns a Promise for the response from an HTTPS REST API call
     * @param {string} url the url that the REST API call is at
     * @return {Promise<string>} the response from the URI
     */
    getRestHttps: async function(url) {
        var dat = '';
        return new Promise(function(resolve, reject) {
            https.get(url, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (dat_chunk) {
                    dat += dat_chunk;
                });
                res.on('end', function() {
                    resolve(dat);
                });
            }).on('error', function(err) {
                console.log('https error');
                console.error(err);
                reject(err)
            });
        }).catch(function(err) {
            return null
        });
    },
    /**
     * Returns a Promise for the response from an HTTP REST API call
     * @param {string} url the url that the REST API call is at
     * @return {Promise<string>} the response from the URI
     */
    getRestHttp: function(url) {
        var dat = '';
        return new Promise( (resolve, reject) => {
            http.get(url, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (dat_chunk) {
                    dat += dat_chunk;
                });
                res.on('end', function() {
                    var parsed = JSON.parse(dat);
                    resolve(parsed);
                });
            }).on('error', function(err) {
                //console.log('http error');
                //console.error(err);
                reject(err);
            });
        }).catch(function(err) {
            return null;
        });
    },
    /**
     * Sends a PUT request to the given host and returns a promise to its response
     * @param {string} host the hostname of the address
     * @param {string} path the path to the resource
     * @param {string} body the request body
     * @param {Object} headers header objects, empty by default
     * @param {number} port port number, 80 by default
     */
    putRestHttp: async function(host, path, body, headers = {}, port = 80) {
        var dat = '';
        var options = {
            host: host,
            port: port,
            path: path,
            headers: headers,
            method: 'PUT'//,
            //protocol: 'http'
        };
        
        return new Promise(function(resolve, reject) {
            var req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    dat += chunk;
                });
                res.on('error', function(err) {
                    console.log('Failed PUT request...');
                    reject('Failed PUT request');
                });
                res.on('end', function() {
                    var parsed = JSON.parse(dat);
                    //console.log(parsed);
                    resolve(parsed);
                });
            });
            req.write(body);
            req.end();
        });
    },
    /**
     * Returns a Promise for the stream to the file from an HTTP GET call
     * @param {string} url the url that the REST API call is at
     * @return {Promise<string>} the response from the URI
     */
    getFileHttp: function(url) {
        var dat = new Stream();
        return new Promise(function(resolve, reject) {
            http.get(url, function(res) {
                res.on('data', function (dat_chunk) {
                    dat.push(dat_chunk);
                });
                res.on('end', function() {
                    resolve(dat);
                });
                res.on('error', function(err) {
                    console.log('http error');
                    console.error(err);
                    reject(undefined)
                })
            }).end();
        });
    },
    /**
     * Gets the JSON response from Plex's authentication service
     * @param {JSON} plexSettings the Plex portion of the settings variable in the main server.js file
     * @return {JSON} the response from the Plex authentication service
     */
    getPlexAuthTokenResponse: function(plexSettings) {
        var options = {
            protocol: 'https:',
            hostname: encodeURI('plex.tv'),
            path: '/users/sign_in.json?user%5Blogin%5D=' + plexSettings.username + 
                            '&user%5Bpassword%5D=' + plexSettings.password,
            port: 443,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Plex-Client-Identifier': 10800,
                'X-Plex-Product': 'PDFlex',
                'X-Plex-Version': 0.1
            }
        };
        var dat = '';
        return new Promise(function(resolve, reject) {
            var req = https.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    dat+=chunk;
                });
                res.on('error', function(err) {
                    console.log('error in getting plex auth token');
                    reject('error in getting token');
                });
                res.on('end', function() {
                    var parsed = JSON.parse(dat);
                    //console.log(parsed);
                    resolve(parsed);
                });
            });
            req.end();
        });
    }//,
    // parseURL: function (url) {
    //     url
    // }
}

/**
 * API Notes
 * 
 * 
 * WorldCat Documentation:
 * http://classify.oclc.org/classify2/api_docs/classify.html
 * http://classify.oclc.org/classify2/api_docs/index.html
 * http://classify.oclc.org/classify2/
 * http://classify.oclc.org/classify2/Classify?author=Chris&title=python
 * 
 */