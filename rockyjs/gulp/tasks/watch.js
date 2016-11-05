'use strict';

// var config = require('../config.js');
var gulp = require('gulp');
var livereload = require('gulp-livereload');

// Watch
gulp.task('watch', ['connect', 'serve'], function () {
  var server = livereload();
    // Watch for changes in `app` folder
    gulp.watch([
        // 'app/jade/**/*.jade',
        // 'app/*.html',
        // 'app/scss/**/*.scss',
        // 'app/scripts/**/*.js',
        // 'app/images/**/*',
        '.tmp/**/*'
    ]).on('change', function(file) {
      server.changed(file.path);
    });


    // Watch .js files
    gulp.watch('app/scripts/**/*.js', ['browserify']);
    gulp.watch('../src/js/**/*.js', ['browserify']);

    // Watch .html files
    gulp.watch('app/**/*.html', ['html']);
});
