var gulp        = require('gulp');
var uglify      = require('gulp-uglify-es').default;
var stripdebug  = require('gulp-strip-debug');
var del         = require('del');
var fs          = require('fs');
var Readable    = require('stream').Readable;
var exec        = require('child_process').exec;

var jsSources   = ['./*.js'];
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

gulp.task('js', function() {
    return gulp.src(jsSources)
     .pipe(stripdebug())
     .pipe(uglify())
     .pipe(gulp.dest(outDir));
});

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

gulp.task('build-docs', function(cb) {
    exec('npm run build-docs', function (err, stdout, stderr) {
        //console.log(stdout);
        console.log(stderr);
        cb(err);
      });
});

gulp.task('build-ng', function(cb) {
    exec('npm run build-ng', function (err, stdout, stderr) {
        //console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('build', 
    gulp.series('clean', 
        gulp.parallel('remove-jsdoc-comments', 'js'), 
        gulp.parallel('build-docs', 'copy-config', 'copy-certs', 'build-ng'), 
        'clean-intermediate'
    )
);