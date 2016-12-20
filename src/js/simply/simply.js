/**
 * Simply.js
 *
 * Provides the classic "SimplyJS" API on top of PebbleJS.
 *
 * Not to be confused with ui/Simply which abstracts the implementation used
 * to interface with the underlying hardware.
 *
 * @namespace simply
 */

var WindowStack = require('ui/windowstack');
var Card = require('ui/card');
var Vibe = require('ui/vibe');

var simply = {};

/**
 * Displays text on the Pebble.
 * @memberOf simply
 * @param {string} textDef - Text to display on the Pebble.
 */
simply.text = function(textDef) {
  var wind = WindowStack.top();
  if (!wind || !(wind instanceof Card)) {
    wind = new Card(textDef);
    wind.show();
  } else {
    wind.prop(textDef, true);
  }
};

/**
 * Vibrates the Pebble.
 * There are three support vibe types: short, long, and double.
 * @memberOf simply
 * @param {string} [type=short] - The vibe type.
 */
simply.vibe = function(type) {
  return Vibe.vibrate(type);
};

module.exports = simply;
