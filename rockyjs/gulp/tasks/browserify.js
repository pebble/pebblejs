'use strict';

var browserify = require('browserify');
var config = require('../config');
var partialify = require('partialify');
var gulp = require('gulp');
var debug = require('gulp-debug');
var rename = require('gulp-rename');
var rev = require('gulp-rev');
var source = require('vinyl-source-stream');

// Vendor
gulp.task('vendor', function() {
  return browserify({debug: true})
    .bundle()
    .pipe(source('vendor.js'))
    .pipe(gulp.dest(config.dist + '/scripts/'));
});

// Browserify
gulp.task('browserify', function() {
  return browserify({debug: true, basedir : '../src/js'})
    .require('../../rockyjs/app/rocky.js', {expose: './rocky.js'})
    .add('../../rockyjs/app/rocky.js')
    .transform(partialify) // Transform to allow requireing of templates
    .bundle()
    .pipe(source('./rocky.js'))
    .pipe(gulp.dest(config.dist + '/scripts/'));
});

// Script Dist
gulp.task('scripts:dist', function() {
  return gulp.src(['dist/scripts/*.js'], {base: 'dist'})
    .pipe(gulp.dest('dist'))
    .pipe(rev())
    .pipe(gulp.dest('dist'))
    .pipe(rev.manifest())
    .pipe(rename('script-manifest.json'))
    .pipe(gulp.dest('dist'));
});
