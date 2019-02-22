'use strict';
var http = require('http');
var express = require('express');
var app = express();
const { spawn } = require('child_process')


var server = http.createServer(app).listen(9877);

let shell = null;

console.log('Starting home-assistant gitwatcher\n\n\n');

app.route('/git').post( (req, res) => {

    console.log('git push detected...');

    if (shell !== null) {
        console.log('server currently running, attempting to kil...');
        try {
            shell.kill();
            console.log('server process killed successfully!');
        } catch (err) {
            console.log('error killing process, aborting...');
            process.exit(1);
        }
    }

    shell = spawn('npm build-n-run');

    shell.on('exit', function (code, signal) {
        console.log(`server.js exited with code ${code} and signal ${signal}`);
    });

    shell.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    process.stdin.pipe(shell.stdin)

});