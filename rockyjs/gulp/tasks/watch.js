'use strict';

// var config = require('../config.js');
var gulp = require('gulp');
var livereload = require('gulp-livereload');

// Watch
gulp.task('watch', ['connect', 'serve'], function () {
  livereload.listen();

  gulp.watch([
    '.tmp/**/*'
  ]).on('change', function(file) {
    livereload.changed(file.path);
  });


  // Watch .js files
  gulp.watch('app/**/*.js', ['browserify']);
  gulp.watch('../src/js/**/*.js', ['browserify']);

  // Watch .html files
  gulp.watch('app/**/*.html', []);
});
