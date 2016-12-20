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
 * The text definition parameter for {@link simply.text}.
 * @typedef {object} simply.textDef
 * @property {string} [title] - A new title for the first and largest text field.
 * @property {string} [subtitle] - A new subtitle for the second large text field.
 * @property {string} [body] - A new body for the last text field meant to display large bodies of text.
 */
/**
 * Sets a group of text fields at once.
 * For example, passing a text definition { title: 'A', subtitle: 'B', body: 'C' }
 * will set the title, subtitle, and body simultaneously. Not all fields need to be specified.
 * When setting a single field, consider using the specific text setters simply.title, simply.subtitle, simply.body.
 * @memberOf simply
 * @param {simply.textDef} textDef - An object defining new text values.
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
