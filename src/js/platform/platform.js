var Platform = module.exports;

Platform.version = function() {
  if (Pebble.getActiveWatchInfo()) {
    return Pebble.getActiveWatchInfo().platform;
  } else {
    return 'aplite';
  }
};
