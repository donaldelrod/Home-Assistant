var gulp        = require('gulp');
var uglify      = require('gulp-uglify-es').default;
var stripdebug  = require('gulp-strip-debug');
var del         = require('del');
var fs          = require('fs');
var Readable    = require('stream').Readable;
var exec        = require('child_process').exec;

var server_sources   = [
                    './server.js',
                    './file_tools.js',
                    './api_tools.js',
                    './prox_tools.js',
                    './google_tools.js',
                    './netgear_tools.js'
                    ];
//['./*.js'];
var device_modules   = './Devices/*.js';
var certSources = ['./https*'];
var confSources = ['./config/*'];
var outDir      = './compiled';
var confOutDir  = './compiled/config';

gulp.task('copy-config', function() {
    return gulp.src(confSources)
     .pipe(gulp.dest(confOutDir));
});

gulp.task('copy-certs', function() {
    return gulp.src(certSources)
     .pipe(gulp.dest(outDir));
})

gulp.task('minify-server', function() {
    return gulp.src(server_sources)
     .pipe(stripdebug())
     .pipe(uglify())
     .pipe(gulp.dest(outDir));
});

gulp.task('minify-device-modules', function() {
    return gulp.src(device_modules)
     .pipe(stripdebug())
     .pipe(uglify())
     .pipe(gulp.dest(outDir + '/Devices'));
})

gulp.task('clean', function() {
    return del(['./compiled/*', './intermediate']);
});

gulp.task('clean-intermediate', function() {
    return del(['./intermediate/']);
})

gulp.task('remove-jsdoc-comments', function() {
    var jsdocs = new RegExp(/\/\*\*\s*\n([^\*]|(\*(?!\/)))*(\@\bfunction\b)([^\*]|(\*(?!\/)))*\*\//, 'gms');
    var serverjs = fs.readFileSync('./server.js', 'utf8');
    var s = new Readable;
    serverjs = serverjs.replace(jsdocs, '')
    s.push(serverjs);
    s.push(null);
    fs.mkdirSync('./intermediate/', {recursive: true});
    fs.writeFile('./intermediate/server.nojsdocs.js', serverjs, function(err) {if (err) console.log(err)});
    return s;
});

// build the docs for the server and main program files
gulp.task('build-server-docs', function(cb) {
    exec('jsdoc -d ' + outDir + '/docs/server -c jsdoc.conf.json', function(err, stdout, stderr) {
        console.log(stderr);
        cb(err);
    })
});

// build the docs for the device modules
gulp.task('build-device-module-docs', function(cb) {
    exec('jsdoc -d ' + outDir + '/docs/server/ ./Devices', function(err, stdout, stderr) {
        console.log(stderr);
        cb(err);
    })
});

gulp.task('build-docs', 
    gulp.series('build-server-docs')
    // exec('npm run build-docs', function (err, stdout, stderr) {
    //     //console.log(stdout);
    //     console.log(stderr);
    //     cb(err);
    //   });
);

gulp.task('build-ng', function(cb) {
    exec('cd angular && ng build --prod --output-path ../compiled/ng', function (err, stdout, stderr) {
        //console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('build', 
    gulp.series('clean', 
        // build 
        gulp.parallel('minify-server', 'minify-device-modules', 'build-ng'), 
        gulp.parallel('remove-jsdoc-comments', 'build-docs', 'copy-config', 'copy-certs'), 
        'clean-intermediate'
    )
);