var path = require('path');
var production = (process.env.NODE_ENV === 'production');

module.exports = {
  bower: 'app/bower_components',
  dist: production ? 'dist' : '.tmp',
	livereloadPort: 35729,
	port: 10011,
	root: path.resolve('./')
};
