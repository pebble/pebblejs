var util2 = require('util2');
var myutil = require('myutil');
var Propable = require('ui/propable');
var StageElement = require('ui/element');

var pathProps = [
  'rotation',
  'offset',
  'p0',
  'p1',
  'p2',
  'p3',
];

var defaults = {
  backgroundColor: 'clear',
  borderColor: 'white',
};

var Path = function(elementDef) {
  StageElement.call(this, myutil.shadow(defaults, elementDef || {}));
  this.state.type = StageElement.PathType;
};

util2.inherit(Path, StageElement);

Propable.makeAccessors(pathProps, Path.prototype);

module.exports = Path;
