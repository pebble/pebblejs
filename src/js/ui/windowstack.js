var util2 = require('util2');
var myutil = require('myutil');
var Emitter = require('emitter');
var simply = require('ui/simply');

var WindowStack = function() {
  this.init();
};

util2.copy(Emitter.prototype, WindowStack.prototype);

WindowStack.prototype.init = function() {
  this.off();
  this._items = [];

};

WindowStack.prototype.top = function() {
  return util2.last(this._items);
};

WindowStack.prototype._emitLoad = function(item, size) {
  item._emitLoad('load', size);
  var e = {
    window: item
  };
  this.emit('load', e);
};

WindowStack.prototype._emitShow = function(item) {
  item.forEachListener(item.onAddHandler);
  item._emitShow('show');

  var e = {
    window: item
  };
  this.emit('show', e);
};

WindowStack.prototype._emitHide = function(item) {
  var e = {
    window: item
  };
  this.emit('hide', e);

  item._emitShow('hide');
  item.forEachListener(item.onRemoveHandler);
};

WindowStack.prototype._show = function(item, pushing) {
  if (!item) { return; }
  item._show(pushing);
  this._emitShow(item);
};

WindowStack.prototype._hide = function(item, broadcast) {
  if (!item) { return; }
  this._emitHide(item);
  item._hide(broadcast);
};

WindowStack.prototype.at = function(index) {
  return this._items[index];
};

WindowStack.prototype.index = function(item) {
  return this._items.indexOf(item);
};

WindowStack.prototype.push = function(item) {
  if (item === this.top()) { return; }
  this.remove(item);
  var prevTop = this.top();
  this._items.push(item);
  this._show(item, true);
  this._hide(prevTop, false);
  console.log('(+) ' + item._toString() + ' : ' + this._toString());
};

WindowStack.prototype.pop = function(broadcast) {
  return this.remove(this.top(), broadcast);
};

WindowStack.prototype.remove = function(item, broadcast) {
  if (typeof item === 'number') {
    item = this.get(item);
  }
  if (!item) { return; }
  var index = this.index(item);
  if (index === -1) { return item; }
  var wasTop = (item === this.top());
  this._items.splice(index, 1);
  if (wasTop) {
    var top = this.top();
    this._show(top);
    this._hide(item, top && top.constructor === item.constructor ? false : broadcast);
  }
  console.log('(-) ' + item._toString() + ' : ' + this._toString());
  return item;
};

WindowStack.prototype.get = function(windowId) {
  var items = this._items;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    var wind = items[i];
    if (wind._id() === windowId) {
      return wind;
    }
  }
};

WindowStack.prototype.each = function(callback) {
  var items = this._items;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    if (callback(items[i], i) === false) {
      break;
    }
  }
};

WindowStack.prototype.emitHide = function(windowId) {
  var wind = this.get(windowId);
  if (wind !== this.top()) { return; }
  this.remove(wind);
};

WindowStack.prototype.emitLoad = function(windowId, size) {
  var wind = this.get(windowId);
  this._emitLoad(wind, size);
};

WindowStack.prototype._toString = function() {
  return this._items.map(function(x){ return x._toString(); }).join(',');
};

module.exports = new WindowStack();
