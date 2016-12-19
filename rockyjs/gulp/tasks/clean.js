'use strict';

var gulp = require('gulp');
var del = require('del');

// Clean
gulp.task('clean', function () {
    return gulp.src(['.tmp'], {read: false}).pipe(del());
});
