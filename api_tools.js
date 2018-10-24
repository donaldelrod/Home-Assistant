var http = require('http');
var https = require('https');
var file_tools = require('./file_tools.js');
var Stream = require('stream').Transform;
 
module.exports = {
    /**
     * Returns a Promise for the response from an HTTPS REST API call
     * @param {string} url the url that the REST API call is at
     * @return {Promise<string>} the response from the URI
     */
    getRestHttps: function(url) {
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
                res.on('error', function(err) {
                    console.log('https error');
                    console.error(err);
                    reject(undefined)
                })
            }).end();
        });
    },
    /**
     * Returns a Promise for the response from an HTTP REST API call
     * @param {string} url the url that the REST API call is at
     * @return {Promise<string>} the response from the URI
     */
    getRestHttp: function(url) {
        var dat = '';
        return new Promise(function(resolve, reject) {
            http.get(url, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (dat_chunk) {
                    dat += dat_chunk;
                });
                res.on('end', function() {
                    resolve(dat);
                });
                res.on('error', function(err) {
                    console.log('http error');
                    console.error(err);
                    reject(undefined)
                });
            }).end();
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
    /***
     * This downloads the covers for the books that have data on Google Books
     * @param {string} fn the filename of the cover to save
     * @param {string} url the URL of the image
     */
    getGoogleCover: function(fn, url) {
        this.getFileHttp(url).then(function(imageData) {
            if (!file_tools.fileExists(fn)) {
                file_tools.writeImageFile(fn, imageData);
                console.log('image '+fn+' does not exist, downloading...');
            } else console.log('image already downloaded');
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
                    console.log(parsed);
                    resolve(parsed);
                });
            });
            req.end();
        });
    },
    /***
     * This function takes a JSON of values to aid in the search of the document, 
     * queries the resource, and then returns JSON of the search results. 
     * The object format for the input looks like this:
     * 
     * @param values = {
     *      hasAuthor: boolean,
     *      author:    string, --optional if hasAuthor is false
     *      hasTitle:  boolean,
     *      title:     string, --optional if hasTitle is false
     *      hasISBN:   boolean,
     *      isbn:      number --optional if hasISBN is false
     * }
     * @return Promise that resolves to the JSON object representing the document search results
     */
    lookupOnGoogle : function(values) {
        if (!values.hasISBN && !values.hasAuthor && !values.hasTitle)
            return {google: false};
        
        var googleURL = this.formGoogleURL(values);

        return new Promise(function(resolve, reject) {
            //sends the response to google and parses the result
            this.getRestHttps(googleURL).then(function(raw) {
                if (raw === undefined)
                    reject({google: false}); 
                var details = doc_tools.parseGoogleJSON(JSON.parse(raw));
                resolve(details);
            });
        });
    },
    /***
     * Forms the URL for the Google request with the inferred values for the documents
     * 
     * @param values = {
     *      hasAuthor: boolean,
     *      author:    string, --optional if hasAuthor is false
     *      hasTitle:  boolean,
     *      title:     string, --optional if hasTitle is false
     *      hasISBN:   boolean,
     *      isbn:      number --optional if hasISBN is false
     * }
     * @return string of the URL of search query
     */
    formGoogleURL: function(values) {
        var googleAPIKey = 'AIzaSyBSb5T4qBCzXeIXIyXxqPeKMJldj7ryZsc';

        var isbnString = values.hasISBN ? ('isbn=' + values.isbn) : '';
        if (values.hasISBN && (values.hasAuthor || values.hasTitle))
            isbnString += '+';
        
        var authorString = values.hasAuthor ? ('inauthor:' + encodeURI(values.author.split(',').join(''))) : '';
        if (values.hasAuthor && values.hasTitle)
            authorString += '+';

        var titleString = values.hasTitle ? ("intitle:" + encodeURI(values.title)) : '';

        return "https://www.googleapis.com/books/v1/volumes?q=" + isbnString + authorString + titleString + "&maxResults=40&key="+ googleAPIKey;
    },
    /***
     * This function takes a JSON of values to aid in the search of the document. The object format looks like this:
     * 
     * @param values = {
     *      hasAuthor: boolean,
     *      author:    string, --optional if hasAuthor is false
     *      hasTitle:  boolean,
     *      title:     string, --optional if hasTitle is false
     *      hasISBN:   boolean,
     *      isbn:      number --optional if hasISBN is false
     * }
     * @return Promise that resolves to the JSON object representing the document search results
     */
    lookupOnWorldcat : function(values) {
        if (!values.hasISBN && !values.hasAuthor && !values.hasTitle)
            return {worldcat: false};

        var worldcatURL = this.formWorldcatURL(values);

        return new Promise(function(resolve, reject) {
            //sends the response to worldcat and parses the result
            this.getRestHttp(worldcatURL).then(function(raw) {
                if (raw === undefined)
                    reject({worldcat: false}); 

                var details = doc_tools.parseWorldCatXML(JSON.parse(raw));

                if (details === null || details === undefined)
                    reject(undefined);

                resolve(details);
            });
        });


    },
    /***
     * Forms the URL for the Worldcat request with the inferred values for the documents
     * 
     * @param values = {
     *      hasAuthor: boolean,
     *      author:    string, --optional if hasAuthor is false
     *      hasTitle:  boolean,
     *      title:     string, --optional if hasTitle is false
     *      hasISBN:   boolean,
     *      isbn:      number --optional if hasISBN is false
     * }
     * @return string of the URL of search query
     * */
    formWorldcatURL : function(values) {
        if (values.hasISBN)
            return 'http://classify.oclc.org/classify2/Classify?isbn=' + values.isbn;

        var authorString = values.hasAuthor ? ('author=' + encodeURI(values.author.split(',').join(''))) : '';
        if (values.hasAuthor && values.hasTitle)
            authorString += '&';

        var titleString = values.hasTitle ? ("title=" + encodeURI(values.title)) : '';

        return 'http://classify.oclc.org/classify2/Classify?' + authorString + titleString;
    }
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