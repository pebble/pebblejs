var util2 = require('../lib/util2');
var myutil = require('../lib/myutil');
var ajax = require('../lib/ajax');
var appinfo = require('app_package.json');

var Settings = module.exports;

var parseJson = function(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.warn('Invalid JSON in localStorage: ' + (e.message || '') + '\n\t' + data);
  }
};

var state;

Settings.settingsUrl = 'http://meiguro.com/simplyjs/settings.html';

Settings.init = function() {
  Settings.reset();

  Settings._loadOptions();
  Settings._loadData();

  // Register listeners for the Settings
  Pebble.addEventListener('showConfiguration', Settings.onOpenConfig);
  Pebble.addEventListener('webviewclosed', Settings.onCloseConfig);
};

Settings.reset = function() {
  state = Settings.state = {
    options: {},
    data: {},
    listeners: [],
    ignoreCancelled: 0,
  };
};

Settings.mainScriptUrl = function(scriptUrl) {
  if (scriptUrl) {
    localStorage.setItem('mainJsUrl', scriptUrl);
  } else {
    scriptUrl = localStorage.getItem('mainJsUrl');
  }
  return scriptUrl;
};

Settings.getBaseOptions = function() {
  return {
    scriptUrl: Settings.mainScriptUrl(),
  };
};

Settings._getDataKey = function(path, field) {
  path = path || appinfo.pebble.uuid;
  return field + ':' + path;
};

Settings._saveData = function(path, field, data) {
  field = field || 'data';
  if (data) {
    state[field] = data;
  } else {
    data = state[field];
  }
  var key = Settings._getDataKey(path, field);
  localStorage.setItem(key, JSON.stringify(data));
};

Settings._loadData = function(path, field, nocache) {
  field = field || 'data';
  state[field] = {};
  var key = Settings._getDataKey(path, field);
  var value = localStorage.getItem(key);
  var data = parseJson(value);
  if (value && typeof data === 'undefined') {
    // There was an issue loading the data, remove it
    localStorage.removeItem(key);
  }
  if (!nocache && typeof data === 'object' && data !== null) {
    state[field] = data;
  }
  return data;
};

Settings._saveOptions = function(path) {
  Settings._saveData(path, 'options');
};

Settings._loadOptions = function(path) {
  Settings._loadData(path, 'options');
};

var makeDataAccessor = function(type, path) {
  return function(field, value) {
    var data = state[type];
    if (arguments.length === 0) {
      return data;
    }
    if (arguments.length === 1 && typeof field !== 'object') {
      return data[field];
    }
    if (typeof field !== 'object' && value === undefined || value === null) {
      delete data[field];
    }
    var def = myutil.toObject(field, value);
    util2.copy(def, data);
    Settings._saveData(path, type);
  };
};

Settings.option = makeDataAccessor('options');

Settings.data = makeDataAccessor('data');

Settings.config = function(opt, open, close) {
  if (typeof opt === 'string') {
    opt = { url: opt };
  }
  if (close === undefined) {
    close = open;
    open = util2.noop;
  }
  var listener = {
    params: opt,
    open: open,
    close: close,
  };
  state.listeners.push(listener);
};

Settings.onOpenConfig = function(e) {
  var options;
  var url;
  var listener = util2.last(state.listeners);
  if (listener) {
    e = {
      originalEvent: e,
      options: state.options,
      url: listener.params.url,
    };
    var result;
    if (listener.open) {
      result = listener.open(e);
      if (result === false) {
        return;
      }
    }
    url = typeof result === 'string' ? result : listener.params.url;
    options = state.options;
  } else {
    url = Settings.settingsUrl;
    options = Settings.getBaseOptions();
    return;
  }
  if (listener.params.hash !== false) {
    url += '#' + encodeURIComponent(JSON.stringify(options));
  }
  Pebble.openURL(url);
};

Settings.onCloseConfig = function(e) {
  // Work around for PebbleKit JS Android
  // On Android, an extra cancelled event occurs after a normal close
  if (e.response !== 'CANCELLED') {
    state.ignoreCancelled++;
  } else if (state.ignoreCancelled > 0) {
    state.ignoreCancelled--;
    return;
  }
  var listener = util2.last(state.listeners);
  var options = {};
  var format;
  if (e.response) {
    options = parseJson(decodeURIComponent(e.response));
    if (typeof options === 'object' && options !== null) {
      format = 'json';
    }
    if (!format && e.response.match(/(&|=)/)) {
      options = ajax.deformify(e.response);
      if (util2.count(options) > 0) {
        format = 'form';
      }
    }
  }
  if (listener) {
    e = {
      originalEvent: e,
      response: e.response,
      originalOptions: state.options,
      options: options,
      url: listener.params.url,
      failed: !format,
      format: format,
    };
    if (format && listener.params.autoSave !== false) {
      e.originalOptions = util2.copy(state.options);
      util2.copy(options, state.options);
      Settings._saveOptions();
    }
    if (listener.close) {
      return listener.close(e);
    }
  }
};
