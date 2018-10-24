var fs = require('fs');
 
module.exports = {
    /**
     * Returns the children of the directory, with the absolute path attached
     * @param {string} folder the path to the folder to get the children of
     * @return {string[]} the children files of the given directory, returns empty array if not a directory
     */
    getChildren: function(folder) {
        if (!this.checkIfDir(folder))
            return [];
        files = fs.readdirSync(folder);
        for (i = 0; i < files.length; i++) {
            files[i] = folder+'/'+files[i];
        }
        return files;
    },
    /**
     * Returns parsed JSON object from file at specified path
     * @param {string} file the path to the JSON file
     * @param {function(json)} callback the function to call when the file has been read
     * @return {JSON} JSON at file location
     */
    readJSONFile: function(file) {
        //console.log(file);
        return new Promise( function(resolve, reject) {
            try {
                fs.readFile(file, function(err, data) {
                    console.log('read JSON');
                    resolve(JSON.parse(data));
                });
            } catch (error) {
                reject([]);
            }
        });
    },
    /**
     * Writes the given JSON object to file
     * @param {string} file path of the file to write
     * @param {JSON} json that JSON object to write to file
     * @param {function(json)} callback the function to call when the JSON has been written to file
     */
    writeJSONFile: function(file, json, callback) {
        fs.writeFile(file, JSON.stringify(json), function (err) {
            if (err) throw err;
            else {
                console.log('wrote JSON');
                callback(json);
            }
        });
    },
    /**
     * Loads the user's config file, or creates a new one if it does not exist
     * @param {function} callback the function to call when the config has been loaded
     * @return {JSON} returns the settings object for the user
     */
    loadConfig: function(folderpath, callback) {
        var configFile = __dirname + '/settings.conf';
        if (!fs.existsSync(configFile)) { //if the config file doesn't exist
            settings = {
                user: {
                    name: "Donald"
                },
                general: {
                    masterDir: folderpath,
                    coverDir: './covers'
                },
                plex: {
                    info: false,
                    token: false,
                    url: '',
                    port: 0,
                    username: '',
                    password: '',
                    X_Auth_Token: ''
                }
            };
            this.writeJSONFile(configFile, settings, callback);
        } else { //or if it does exist...
            console.log('settings exist')
            settings = this.readJSONFile(configFile, callback);
        }
        console.log(settings);
        return settings;
    },
    /**
     * Checks if the given path is a file or directory
     * @param {string} file path to check if directory or not
     * @return {boolean} returns true if the path is a directory, false if it is anything else
     */
    checkIfDir: function(file) {
        var stat = fs.statSync(file)
        return stat.isDirectory();
    },
    /**
     * Returns the file type of the provided file
     * @param {string} file the name of the file
     * @return {string} the file type
     */
    getFiletype: function(file) {
        return file.slice(file.lastIndexOf('.')+1);
    },
    /**
     * Returns the children files of the given directory absolute path
     * @param {string} fn absolute path of the file in the file system
     * @return {string[]} array of filenames of directory's children
     */
    getChdir: function(fn) {
        var files = getChildren(fn);
        var fo = [];
        files.forEach( file => { //adds only the files to the array
            var stats = fs.statSync(folderpath+file);
            if (stats.isFile(folderpath+file)) {
                fo.push(file);
            }
        });
        return fo;
    },
    /**
     * Checks to see if the file exists
     * 
     * Synchronous function
     * @param {string} file path of the file
     */
    fileExists: function(file) {
        return fs.existsSync(file);
    },
    /**
     * Writes the image in data to file
     * 
     * Image is from Google URL
     * @param {string} fn name of the file to write
     * @param {string} data the image data to be written to file
     */
    writeImageFile: function(fn, data) {
        //console.log(data.substr(0,20));
        var fd = fs.openSync('./backend/covers/' + fn, 'w+');
        fs.writeFileSync(fd, data.read(), function(err) {
            console.error('cover download failed: ' + err);
        });
    },
    /**
     * Deletes the file given by fn, and then calls the callback function
     * @param {string} fn the path to the file to delete
     * @param {function} callback the function to perform when the delete is completed
     */
    deleteFile: function(fn, callback) {
        fs.unlinkSync(fn);
        callback();
    }
}; 