'use strict';

var gulp = require('gulp');

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('dev');
});
