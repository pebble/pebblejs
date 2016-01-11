var util2 = require('util2');
var myutil = require('myutil');
var Emitter = require('emitter');
var Accel = require('ui/accel');
var WindowStack = require('ui/windowstack');
var Propable = require('ui/propable');
var Stage = require('ui/stage');
var simply = require('ui/simply');

var buttons = [
  'back',
  'up',
  'select',
  'down',
];

/**
 * Enable fullscreen in the Pebble UI.
 * Fullscreen removes the Pebble status bar, giving slightly more vertical display height.
 * @memberOf simply
 * @param {boolean} fullscreen - Whether to enable fullscreen mode.
 */

/**
 * Enable scrolling in the Pebble UI.
 * When scrolling is enabled, up and down button presses are no longer forwarded to JavaScript handlers.
 * Single select, long select, and accel tap events are still available to you however.
 * @memberOf simply
 * @param {boolean} scrollable - Whether to enable a scrollable view.
 */

var configProps = [
  'fullscreen',
  'style',
  'scrollable',
  'backgroundColor',
];

var actionProps = [
  'up',
  'select',
  'back',
  'backgroundColor',
];

var accessorProps = configProps;

var defaults = {
  backgroundColor: 'black',
  fullscreen: false,
  scrollable: false,
  statusBackgroundColor: 'black',
  statusTextColor: 'white',
};

var nextId = 1;

var Window = function(windowDef) {
  this.state = myutil.shadow(defaults, windowDef || {});
  this.state.id = nextId++;
  this._buttonInit();
  this._items = [];
  this._dynamic = true;
};

Window._codeName = 'window';

util2.copy(Emitter.prototype, Window.prototype);

util2.copy(Propable.prototype, Window.prototype);

util2.copy(Stage.prototype, Window.prototype);

Propable.makeAccessors(accessorProps, Window.prototype);

Window.prototype._id = function() {
  return this.state.id;
};

Window.prototype._hide = function(broadcast) {
  if (broadcast === false) { return; }
  simply.impl.windowHide(this._id());
};

Window.prototype.hide = function() {
  WindowStack.remove(this, true);
  return this;
};

Window.prototype._show = function(pushing) {
  this._prop(this.state, true, pushing || false);
  this._buttonConfig({});
  if (this._dynamic) {
    Stage.prototype._show.call(this, pushing);
  }
};

Window.prototype.show = function() {
  WindowStack.push(this);
  return this;
};

Window.prototype._insert = function() {
  if (this._dynamic) {
    Stage.prototype._insert.apply(this, arguments);
  }
};

Window.prototype._remove = function() {
  if (this._dynamic) {
    Stage.prototype._remove.apply(this, arguments);
  }
};

Window.prototype._clearAction = function() {
  actionProps.forEach(Propable.unset.bind(this.state.action));
};

Window.prototype._clear = function(flags) {
  flags = myutil.toFlags(flags);
  if (myutil.flag(flags, 'action')) {
    this._clearAction();
  }
};

Window.prototype.prop = function(field, value, clear) {
  if (arguments.length === 0) {
    return util2.copy(this.state);
  }
  if (arguments.length === 1 && typeof field !== 'object') {
    return this.state[field];
  }
  if (typeof field === 'object') {
    clear = value;
  }
  if (clear) {
    this._clear(true);
  }
  var windowDef = myutil.toObject(field, value);
  util2.copy(windowDef, this.state);
  this._prop(windowDef);
  return this;
};

Window.prototype._action = function(actionDef) {
  if (this === WindowStack.top()) {
    simply.impl.windowActionBar(actionDef);
  }
};

Window.prototype.action = function(field, value, clear) {
  var action = this.state.action;
  if (!action) {
    action = this.state.action = {};
  }
  if (arguments.length === 0) {
    return action;
  }
  if (arguments.length === 1 && typeof field === 'string') {
    return action[field];
  }
  if (typeof field !== 'string') {
    clear = value;
  }
  if (clear) {
    this._clear('action');
  }
  if (typeof field !== 'boolean') {
    util2.copy(myutil.toObject(field, value), this.state.action);
  }
  this._action(field);
  return this;
};

var isBackEvent = function(type, subtype) {
  return ((type === 'click' || type === 'longClick') && subtype === 'back');
};

Window.prototype.onAddHandler = function(type, subtype) {
  if (isBackEvent(type, subtype)) {
    this._buttonAutoConfig();
  }
  if (type === 'accelData') {
    Accel.autoSubscribe();
  }
};

Window.prototype.onRemoveHandler = function(type, subtype) {
  if (!type || isBackEvent(type, subtype)) {
    this._buttonAutoConfig();
  }
  if (!type || type === 'accelData') {
    Accel.autoSubscribe();
  }
};

Window.prototype._buttonInit = function() {
  this._button = {
    config: {},
    configMode: 'auto',
  };
  for (var i = 0, ii = buttons.length; i < ii; i++) {
    var button = buttons[i];
    if (button !== 'back') {
      this._button.config[buttons[i]] = true;
    }
  }
};

/**
 * The button configuration parameter for {@link simply.buttonConfig}.
 * The button configuration allows you to enable to disable buttons without having to register or unregister handlers if that is your preferred style.
 * You may also enable the back button manually as an alternative to registering a click handler with 'back' as its subtype using {@link simply.on}.
 * @typedef {object} simply.buttonConf
 * @property {boolean} [back] - Whether to enable the back button. Initializes as false. Simply.js can also automatically register this for you based on the amount of click handlers with subtype 'back'.
 * @property {boolean} [up] - Whether to enable the up button. Initializes as true. Note that this is disabled when using {@link simply.scrollable}.
 * @property {boolean} [select] - Whether to enable the select button. Initializes as true.
 * @property {boolean} [down] - Whether to enable the down button. Initializes as true. Note that this is disabled when using {@link simply.scrollable}.
 */

/**
 * Changes the button configuration.
 * See {@link simply.buttonConfig}
 * @memberOf simply
 * @param {simply.buttonConfig} buttonConf - An object defining the button configuration.
 */
Window.prototype._buttonConfig = function(buttonConf, auto) {
  if (buttonConf === undefined) {
    var config = {};
    for (var i = 0, ii = buttons.length; i < ii; ++i) {
      var name = buttons[i];
      config[name] = this._button.config[name];
    }
    return config;
  }
  for (var k in buttonConf) {
    if (buttons.indexOf(k) !== -1) {
      if (k === 'back') {
        this._button.configMode = buttonConf.back && !auto ? 'manual' : 'auto';
      }
      this._button.config[k] = buttonConf[k];
    }
  }
  if (simply.impl.windowButtonConfig) {
    return simply.impl.windowButtonConfig(this._button.config);
  }
};

Window.prototype.buttonConfig = function(buttonConf) {
  this._buttonConfig(buttonConf);
};

Window.prototype._buttonAutoConfig = function() {
  if (!this._button || this._button.configMode !== 'auto') {
    return;
  }
  var singleBackCount = this.listenerCount('click', 'back');
  var longBackCount = this.listenerCount('longClick', 'back');
  var useBack = singleBackCount + longBackCount > 0;
  if (useBack !== this._button.config.back) {
    this._button.config.back = useBack;
    return this._buttonConfig(this._button.config, true);
  }
};

Window.prototype._toString = function() {
  return '[' + this.constructor._codeName + ' ' + this._id() + ']';
};

Window.prototype._emit = function(type, subtype, e) {
  e.window = this;
  var klass = this.constructor;
  if (klass) {
    e[klass._codeName] = this;
  }
  if (this.emit(type, subtype, e) === false) {
    return false;
  }
};

Window.prototype._emitShow = function(type) {
  return this._emit(type, null, {});
};

Window.emit = function(type, subtype, e) {
  var wind = WindowStack.top();
  if (wind) {
    return wind._emit(type, subtype, e);
  }
};

/**
 * Simply.js button click event. This can either be a single click or long click.
 * Use the event type 'click' or 'longClick' to subscribe to these events.
 * @typedef simply.clickEvent
 * @property {string} button - The button that was pressed: 'back', 'up', 'select', or 'down'. This is also the event subtype.
 */

Window.emitClick = function(type, button) {
  var e = {
    button: button,
  };
  return Window.emit(type, button, e);
};

module.exports = Window;
