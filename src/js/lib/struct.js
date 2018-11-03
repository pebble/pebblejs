/**
 * struct.js - chainable ArrayBuffer DataView wrapper
 *
 * @author Meiguro / http://meiguro.com/
 * @license MIT
 */

var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

var struct = function(def) {
  this._littleEndian = true;
  this._offset = 0;
  this._cursor = 0;
  this._makeAccessors(def);
  this._view = new DataView(new ArrayBuffer(this._size));
  this._def = def;
};

struct.types = {
  int8: { size: 1 },
  uint8: { size: 1 },
  int16: { size: 2 },
  uint16: { size: 2 },
  int32: { size: 4 },
  uint32: { size: 4 },
  int64: { size: 8 },
  uint64: { size: 8 },
  float32: { size: 2 },
  float64: { size: 4 },
  cstring: { size: 1, dynamic: true },
  data: { size: 0, dynamic: true },
};

var makeDataViewAccessor = function(type, typeName) {
  var getName = 'get' + capitalize(typeName);
  var setName = 'set' + capitalize(typeName);
  type.get = function(offset, little) {
    this._advance = type.size;
    return this._view[getName](offset, little);
  };
  type.set = function(offset, value, little) {
    this._advance = type.size;
    this._view[setName](offset, value, little);
  };
};

for (var k in struct.types) {
  var type = struct.types[k];
  makeDataViewAccessor(type, k);
}

struct.types.bool = struct.types.uint8;

struct.types.uint64.get = function(offset, little) {
  var buffer = this._view;
  var a = buffer.getUint32(offset, little);
  var b = buffer.getUint32(offset + 4, little);
  this._advance = 8;
  return ((little ? b : a) * Math.pow(2, 32)) + (little ? a : b);
};

struct.types.uint64.set = function(offset, value, little) {
  var a = value & 0xFFFFFFFF;
  var b = (value >> 32) & 0xFFFFFFFF;
  var buffer = this._view;
  buffer.setUint32(offset, little ? a : b, little);
  buffer.setUint32(offset + 4, little ? b : a, little);
  this._advance = 8;
};

struct.types.cstring.get = function(offset) {
  var chars = [];
  var buffer = this._view;
  for (var i = offset, ii = buffer.byteLength, j = 0; i < ii && buffer.getUint8(i) !== 0; ++i, ++j) {
    chars[j] = String.fromCharCode(buffer.getUint8(i));
  }
  this._advance = chars.length + 1;
  return decodeURIComponent(escape(chars.join('')));
};

struct.types.cstring.set = function(offset, value) {
  value = unescape(encodeURIComponent(value));
  this._grow(offset + value.length + 1);
  var i = offset;
  var buffer = this._view;
  for (var j = 0, jj = value.length; j < jj && value[i] !== '\0'; ++i, ++j) {
    buffer.setUint8(i, value.charCodeAt(j));
  }
  buffer.setUint8(i, 0);
  this._advance = value.length + 1;
};

struct.types.data.get = function(offset) {
  var length = this._value;
  this._cursor = offset;
  var buffer = this._view;
  var copy = new DataView(new ArrayBuffer(length));
  for (var i = 0; i < length; ++i) {
    copy.setUint8(i, buffer.getUint8(i + offset));
  }
  this._advance = length;
  return copy;
};

struct.types.data.set = function(offset, value) {
  var length = value.byteLength || value.length;
  this._cursor = offset;
  this._grow(offset + length);
  var buffer = this._view;
  if (value instanceof ArrayBuffer) {
    value = new DataView(value);
  }
  for (var i = 0; i < length; ++i) {
    buffer.setUint8(i + offset, value instanceof DataView ? value.getUint8(i) : value[i]);
  }
  this._advance = length;
};

struct.prototype._grow = function(target) {
  var buffer = this._view;
  var size = buffer.byteLength;
  if (target <= size) { return; }
  while (size < target) { size *= 2; }
  var copy = new DataView(new ArrayBuffer(size));
  for (var i = 0; i < buffer.byteLength; ++i) {
    copy.setUint8(i, buffer.getUint8(i));
  }
  this._view = copy;
};

struct.prototype._prevField = function(field) {
  field = field || this._access;
  var fieldIndex = this._fields.indexOf(field);
  return this._fields[fieldIndex - 1];
};

struct.prototype._makeAccessor = function(field) {
  this[field.name] = function(value) {
    var type = field.type;
    
    if (field.dynamic) {
      var prevField = this._prevField(field);
      if (prevField === undefined) {
        this._cursor = 0;
      } else if (this._access === field) {
        this._cursor -= this._advance;
      } else if (this._access !== prevField) {
        throw new Error('dynamic field requires sequential access');
      }
    } else {
      this._cursor = field.index;
    }
    this._access = field;
    var result = this;
    if (arguments.length === 0) {
      result = type.get.call(this, this._offset + this._cursor, this._littleEndian);
      this._value = result;
    } else {
      if (field.transform) {
        value = field.transform(value, field);
      }
      type.set.call(this, this._offset + this._cursor, value, this._littleEndian);
      this._value = value;
    }
    this._cursor += this._advance;
    return result;
  };
  return this;
};

struct.prototype._makeMetaAccessor = function(name, transform) {
  this[name] = function(value, field) {
    transform.call(this, value, field);
    return this;
  };
};

struct.prototype._makeAccessors = function(def, index, fields, prefix) {
  index = index || 0;
  this._fields = ( fields = fields || [] );
  var prevField = fields[fields.length];
  for (var i = 0, ii = def.length; i < ii; ++i) {
    var member = def[i];
    var type = member[0];
    if (typeof type === 'string') {
      type = struct.types[type];
    }
    var name = member[1];
    if (prefix) {
      name = prefix + capitalize(name);
    }
    var transform = member[2];
    if (type instanceof struct) {
      if (transform) {
        this._makeMetaAccessor(name, transform);
      }
      this._makeAccessors(type._def, index, fields, name);
      index = this._size;
      continue;
    }
    var field = {
      index: index,
      type: type,
      name: name,
      transform: transform,
      dynamic: type.dynamic || prevField && prevField.dynamic,
    };
    this._makeAccessor(field);
    fields.push(field);
    index += type.size;
    prevField = field;
  }
  this._size = index;
  return this;
};

struct.prototype.prop = function(def) {
  var fields = this._fields;
  var i = 0, ii = fields.length, name;
  if (arguments.length === 0) {
    var obj = {};
    for (; i < ii; ++i) {
      name = fields[i].name;
      obj[name] = this[name]();
    }
    return obj;
  }
  for (; i < ii; ++i) {
    name = fields[i].name;
    if (name in def) {
      this[name](def[name]);
    }
  }
  return this;
};

struct.prototype.view = function(view) {
  if (arguments.length === 0) {
    return this._view;
  }
  if (view instanceof ArrayBuffer) {
    view = new DataView(view);
  }
  this._view = view;
  return this;
};

struct.prototype.offset = function(offset) {
  if (arguments.length === 0) {
    return this._offset;
  }
  this._offset = offset;
  return this;
};

module.exports = struct;

