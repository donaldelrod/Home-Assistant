var gulp =      require('gulp');
//var gutil =     require('gulp-util');
var uglify =    require('gulp-uglify-es').default;
var stripdebug = require('gulp-strip-debug');
var del =       require('del');

var jsSources = ['./*.js'];
var certSources = ['./https*'];
var confSources = ['./config/*'];
var outDir = './compiled';
var confOutDir = './compiled/config';
//var jsOut = 'server.min.js';

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
    return del(['./compiled/*']);
});

gulp.task('build', gulp.series('clean', 'js', 'copy-config', 'copy-certs'));