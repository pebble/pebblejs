'use strict';

var config = require('../config');
var gulp = require('gulp');

// Connect
gulp.task('connect', function () {
  var connect = require('connect');
  var serveStatic = require('serve-static')
  var app = connect()
    .use(require('connect-livereload')({ port: config.livereloadPort }))
    .use('/', serveStatic('.tmp'))
    .use('/', serveStatic('app'))

  require('http').createServer(app)
    .listen(config.port)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:' + config.port);
    });
});

gulp.task('serve', ['connect', 'styles'], function () {
  require('opn')('http://localhost:' + config.port);
});
