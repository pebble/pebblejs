'use strict';

var browserify = require('browserify');
var config = require('../config');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var size = require('gulp-size');

gulp.task('browserify', function() {
  return browserify({debug: true, basedir : '../src/js'})
    .require('../../rockyjs/app/simply-rocky.js', {expose: './ui/simply-pebble.js'})
    .require('./hardCodedSourceData.js', {expose: './sourceData.js'})
    .add('app.js')
    .bundle()
    .pipe(source('./rocky.js'))
    .pipe(gulp.dest(config.dist + '/scripts/'))
    .pipe(size());
});
