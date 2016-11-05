'use strict';

var gulp = require('gulp');
var rimraf = require('gulp-rimraf');

// Clean
gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist/styles', 'dist/scripts', 'dist/images'], {read: false}).pipe(rimraf());
});
