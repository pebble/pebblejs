'use strict';

var gulp = require('gulp');

// Dev Server
gulp.task('dev', ['html', 'styles', 'vendor', 'browserify', 'images', 'watch']);
