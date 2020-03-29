var express = require('express');
var router = express.Router();

let globals = require('../globals.js');


//---------------------------------------------OpenCV API

/**
 * @apiDefine linuxOnly
 * @apiError ModuleNotSupported this endpoint uses a module that is not available on the platform the server is running on
 * @apiErrorExample {json} Response (example):
 *      HTTP/2.0 501 Not Implemented
 *      {
 *          "error": "OpenCV only supported on Raspberry Pi"
 *      }
 */

/**
 * @api {get} /api/opencv/takepic OpenCVTakePicture
 * @apiName OpenCVTakePicture
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Tells the server to take a picture using an attached webcam
 * 
 * @apiSuccess (200) {HTTPStatus} OK-200 returns a status code of 200
 * @apiUse linuxOnly
 * @apiUse authToken
 */
router.route('/takepic').get((req, res) => {
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }
    var frame = modules.cv.webcam.read();
    modules.cv.imwrite('./opencv/' + (new Date()).toISOString() + '.jpg', frame);
    res.sendStatus(200);
});

/**
 * @api {get} /api/opencv/listpics OpenCVListPictures
 * @apiName OpenCVListPictures
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Returns a list of pictures taken by the server
 * 
 * @apiSuccess (200) {string[]} pictures a list of paths to the pictures taken
 * @apiError NoPictures no pictures were returned by this function
 * @apiErrorExample {json} Response (exmaple):
 *      HTTP/2.0 401 Not Found
 *      {
 *          "error": "Couldn't get pictures"
 *      }
 * @apiUse linuxOnly
 * @apiUse authToken
 */
router.route('/listpics').get((req, res) => {
    //if (!checkRequest(req, res)) return;
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }

    var pictures = file_tools.getChildren('./opencv/');

    if (pictures !== undefined)
        res.status(200).json(pictures);
    else res.status(401).json({error: 'Couldn\'t get pictures'});
});

/**
 * @api {get} /api/opencv/getpic/:filename OpenCVDownloadPicture
 * @apiName OpenCVDownloadPicture
 * @apiGroup OpenCV
 * @apiVersion  0.1.0
 * @apiDescription *Linux/Raspberry Pi Only* Sends the picture specified in the request to the client
 * 
 * @apiParam (path) {string} filename the name of the image that should be downloaded
 * 
 * @apiSuccess (200) {application/octet-stream} picture the picture specified in the request as an octet-stream
 * @apiError NoPictures no pictures were returned by this function
 * @apiErrorExample {json} Response (exmaple):
 *      HTTP/2.0 401 Not Found
 *      {
 *          "error": "Couldn't get picture"
 *      }
 * @apiUse linuxOnly
 * @apiUse authToken
 */
router.route('/getpic/:filename').get((req, res) => { //idk if this works
    //if (!checkRequest(req, res)) return;
    
    if (platform !== 'linux') {
        res.status(501).json({error: 'OpenCV only supported on Raspberry Pi'});
        return;
    }
    if (file_tools.fileExists(req.params.filename)) {
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + req.params.filename
        });
        fs.createReadStream(req.query.filename).pipe(res);
    }
    else {
        res.status(401).json({error: 'Couldn\'t get picture'});
    }
});

module.exports = router;