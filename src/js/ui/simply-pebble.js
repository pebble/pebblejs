var struct = require('struct');
var util2 = require('util2');
var myutil = require('myutil');
var Platform = require('platform');
var Wakeup = require('wakeup');
var Timeline = require('timeline');
var Resource = require('ui/resource');
var Accel = require('ui/accel');
var Voice = require('ui/voice');
var ImageService = require('ui/imageservice');
var WindowStack = require('ui/windowstack');
var Window = require('ui/window');
var Menu = require('ui/menu');
var StageElement = require('ui/element');

var simply = require('ui/simply');

/**
 * This package provides the underlying implementation for the ui/* classes.
 *
 * This implementation uses PebbleKit JS AppMessage to send commands to a Pebble Watch.
 */

/**
 * First part of this file is defining the commands and types that we will use later.
 */

var state;

var BoolType = function(x) {
  return x ? 1 : 0;
};

var StringType = function(x) {
  return '' + x;
};

var UTF8ByteLength = function(x) {
  return unescape(encodeURIComponent(x)).length;
};

var EnumerableType = function(x) {
  if (typeof x === 'string') {
    return UTF8ByteLength(x);
  } else if (x && x.hasOwnProperty('length')) {
    return x.length;
  }
  return x ? Number(x) : 0;
};

var TimeType = function(x) {
  if (x instanceof Date) {
    x = x.getTime() / 1000;
  }
  return (x ? Number(x) : 0) + state.timeOffset;
};

var ImageType = function(x) {
  if (x && typeof x !== 'number') {
    return ImageService.resolve(x);
  }
  return x ? Number(x) : 0;
};

var PositionType = function(x) {
  this.positionX(x.x);
  this.positionY(x.y);
};

var SizeType = function(x) {
  this.sizeW(x.x);
  this.sizeH(x.y);
};

var hexColorMap = {
  '#000000': 0xC0,
  '#000055': 0xC1,
  '#0000AA': 0xC2,
  '#0000FF': 0xC3,
  '#005500': 0xC4,
  '#005555': 0xC5,
  '#0055AA': 0xC6,
  '#0055FF': 0xC7,
  '#00AA00': 0xC8,
  '#00AA55': 0xC9,
  '#00AAAA': 0xCA,
  '#00AAFF': 0xCB,
  '#00FF00': 0xCC,
  '#00FF55': 0xCD,
  '#00FFAA': 0xCE,
  '#00FFFF': 0xCF,
  '#550000': 0xD0,
  '#550055': 0xD1,
  '#5500AA': 0xD2,
  '#5500FF': 0xD3,
  '#555500': 0xD4,
  '#555555': 0xD5,
  '#5555AA': 0xD6,
  '#5555FF': 0xD7,
  '#55AA00': 0xD8,
  '#55AA55': 0xD9,
  '#55AAAA': 0xDA,
  '#55AAFF': 0xDB,
  '#55FF00': 0xDC,
  '#55FF55': 0xDD,
  '#55FFAA': 0xDE,
  '#55FFFF': 0xDF,
  '#AA0000': 0xE0,
  '#AA0055': 0xE1,
  '#AA00AA': 0xE2,
  '#AA00FF': 0xE3,
  '#AA5500': 0xE4,
  '#AA5555': 0xE5,
  '#AA55AA': 0xE6,
  '#AA55FF': 0xE7,
  '#AAAA00': 0xE8,
  '#AAAA55': 0xE9,
  '#AAAAAA': 0xEA,
  '#AAAAFF': 0xEB,
  '#AAFF00': 0xEC,
  '#AAFF55': 0xED,
  '#AAFFAA': 0xEE,
  '#AAFFFF': 0xEF,
  '#FF0000': 0xF0,
  '#FF0055': 0xF1,
  '#FF00AA': 0xF2,
  '#FF00FF': 0xF3,
  '#FF5500': 0xF4,
  '#FF5555': 0xF5,
  '#FF55AA': 0xF6,
  '#FF55FF': 0xF7,
  '#FFAA00': 0xF8,
  '#FFAA55': 0xF9,
  '#FFAAAA': 0xFA,
  '#FFAAFF': 0xFB,
  '#FFFF00': 0xFC,
  '#FFFF55': 0xFD,
  '#FFFFAA': 0xFE,
  '#FFFFFF': 0xFF,
};

var namedColorMap = {
  'clear': 0x00,
  'black': 0xC0,
  'oxfordBlue': 0xC1,
  'dukeBlue': 0xC2,
  'blue': 0xC3,
  'darkGreen': 0xC4,
  'midnightGreen': 0xC5,
  'cobaltBlue': 0xC6,
  'blueMoon': 0xC7,
  'islamicGreen': 0xC8,
  'jaegerGreen': 0xC9,
  'tiffanyBlue': 0xCA,
  'vividCerulean': 0xCB,
  'green': 0xCC,
  'malachite': 0xCD,
  'mediumSpringGreen': 0xCE,
  'cyan': 0xCF,
  'bulgarianRose': 0xD0,
  'imperialPurple': 0xD1,
  'indigo': 0xD2,
  'electricUltramarine': 0xD3,
  'armyGreen': 0xD4,
  'darkGray': 0xD5,
  'liberty': 0xD6,
  'veryLightBlue': 0xD7,
  'kellyGreen': 0xD8,
  'mayGreen': 0xD9,
  'cadetBlue': 0xDA,
  'pictonBlue': 0xDB,
  'brightGreen': 0xDC,
  'screaminGreen': 0xDD,
  'mediumAquamarine': 0xDE,
  'electricBlue': 0xDF,
  'darkCandyAppleRed': 0xE0,
  'jazzberryJam': 0xE1,
  'purple': 0xE2,
  'vividViolet': 0xE3,
  'windsorTan': 0xE4,
  'roseVale': 0xE5,
  'purpureus': 0xE6,
  'lavenderIndigo': 0xE7,
  'limerick': 0xE8,
  'brass': 0xE9,
  'lightGray': 0xEA,
  'babyBlueEyes': 0xEB,
  'springBud': 0xEC,
  'inchworm': 0xED,
  'mintGreen': 0xEE,
  'celeste': 0xEF,
  'red': 0xF0,
  'folly': 0xF1,
  'fashionMagenta': 0xF2,
  'magenta': 0xF3,
  'orange': 0xF4,
  'sunsetOrange': 0xF5,
  'brilliantRose': 0xF6,
  'shockingPink': 0xF7,
  'chromeYellow': 0xF8,
  'rajah': 0xF9,
  'melon': 0xFA,
  'richBrilliantLavender': 0xFB,
  'yellow': 0xFC,
  'icterine': 0xFD,
  'pastelYellow': 0xFE,
  'white': 0xFF,
  'clearWhite': 0x3F,
};

var Color = function(color) {
  if (color.charAt(0) === '#') {
    // Convert shorthand hex to full length for rounding
    if (color.length === 4) {
      var r = color.charAt(1);
      var g = color.charAt(2);
      var b = color.charAt(3);
      color = '#'+r+r+g+g+b+b;
    }
    // Ensure upper case
    color = color.toUpperCase();
    return hexColorMap[roundColor(color)];
  }
  return namedColorMap[color] ? namedColorMap[color] : namedColorMap.clear;
};

var pebbleColors = ['00', '55', 'AA', 'FF'];

var roundColor = function (color) {
  var rHex = color.substr(1, 2);
  var gHex = color.substr(3, 2);
  var bHex = color.substr(5, 2);
  var r = findClosestColor(rHex, pebbleColors);
  var g = findClosestColor(gHex, pebbleColors);
  var b = findClosestColor(bHex, pebbleColors);
  return '#'+r+g+b;
};

var findClosestColor = function(color, colors) {
  var nearestDist = Infinity;
  var result = color;
  colors.forEach(function(col) {
    var dist = Math.abs(parseInt(color, 16) - parseInt(col, 16));
    if (dist < nearestDist) {
      nearestDist = dist;
      result = col;
    }
  });
  return result;
};

var Font = function(x) {
  var id = Resource.getId(x);
  if (id) {
    return id;
  }
  x = myutil.toCConstantName(x);
  if (!x.match(/^RESOURCE_ID/)) {
    x = 'RESOURCE_ID_' + x;
  }
  x = x.replace(/_+/g, '_');
  return x;
};

var TextOverflowMode = function(x) {
  switch (x) {
    case 'wrap'    : return 0;
    case 'ellipsis': return 1;
    case 'fill'    : return 2;
  }
  return Number(x);
};

var TextAlignment = function(x) {
  switch (x) {
    case 'left'  : return 0;
    case 'center': return 1;
    case 'right' : return 2;
  }
  return Number(x);
};

var TimeUnits = function(x) {
  var z = 0;
  x = myutil.toObject(x, true);
  for (var k in x) {
    switch (k) {
      case 'seconds': z |= (1 << 0); break;
      case 'minutes': z |= (1 << 1); break;
      case 'hours'  : z |= (1 << 2); break;
      case 'days'   : z |= (1 << 3); break;
      case 'months' : z |= (1 << 4); break;
      case 'years'  : z |= (1 << 5); break;
    }
  }
  return z;
};

var CompositingOp = function(x) {
  switch (x) {
    case 'assign':
    case 'normal': return 0;
    case 'assignInverted':
    case 'invert': return 1;
    case 'or'    : return 2;
    case 'and'   : return 3;
    case 'clear' : return 4;
    case 'set'   : return 5;
  }
  return Number(x);
};

var AnimationCurve = function(x) {
  switch (x) {
    case 'linear'   : return 0;
    case 'easeIn'   : return 1;
    case 'easeOut'  : return 2;
    case 'easeInOut': return 3;
  }
  return Number(x);
};

var MenuRowAlign = function(x) {
  switch(x) {
    case 'none'   : return 0;
    case 'center' : return 1;
    case 'top'    : return 2;
    case 'bottom' : return 3;
  }
  return x ? Number(x) : 0;
};

var makeArrayType = function(types) {
  return function(x) {
    var index = types.indexOf(x);
    if (index !== -1) {
      return index;
    }
    return Number(x);
  };
};

var makeFlagsType = function(types) {
  return function(x) {
    var z = 0;
    for (var k in x) {
      if (!x[k]) { continue; }
      var index = types.indexOf(k);
      if (index !== -1) {
        z |= 1 << index;
      }
    }
    return z;
  };
};

var LaunchReasonTypes = [
  'system',
  'user',
  'phone',
  'wakeup',
  'worker',
  'quickLaunch',
  'timelineAction'
];

var LaunchReasonType = makeArrayType(LaunchReasonTypes);

var WindowTypes = [
  'window',
  'menu',
  'card',
];

var WindowType = makeArrayType(WindowTypes);

var ButtonTypes = [
  'back',
  'up',
  'select',
  'down',
];

var ButtonType = makeArrayType(ButtonTypes);

var ButtonFlagsType = makeFlagsType(ButtonTypes);

var CardTextTypes = [
  'title',
  'subtitle',
  'body',
];

var CardTextType = makeArrayType(CardTextTypes);

var CardTextColorTypes = [
  'titleColor',
  'subtitleColor',
  'bodyColor',
];

var CardImageTypes = [
  'icon',
  'subicon',
  'banner',
];

var CardImageType = makeArrayType(CardImageTypes);

var CardStyleTypes = [
  'small',
  'large',
  'mono',
];

var CardStyleType = makeArrayType(CardStyleTypes);

var VibeTypes = [
  'short',
  'long',
  'double',
];

var VibeType = makeArrayType(VibeTypes);

var LightTypes = [
  'on',
  'auto',
  'trigger'
];

var LightType = makeArrayType(LightTypes);

var DictationSessionStatus = [
  null,
  'transcriptionRejected',
  'transcriptionRejectedWithError',
  'systemAborted',
  'noSpeechDetected',
  'connectivityError',
  'disabled',
  'internalError',
  'recognizerError',
];
// Custom Dictation Errors:
DictationSessionStatus[64] = "sessionAlreadyInProgress";
DictationSessionStatus[65] = "noMicrophone";

var Packet = new struct([
  ['uint16', 'type'],
  ['uint16', 'length'],
]);

var SegmentPacket = new struct([
  [Packet, 'packet'],
  ['bool', 'isLast'],
  ['data', 'buffer'],
]);

var ReadyPacket = new struct([
  [Packet, 'packet'],
]);

var LaunchReasonPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'reason', LaunchReasonType],
  ['uint32', 'args'],
  ['uint32', 'time'],
  ['bool', 'isTimezone'],
]);

var WakeupSetPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'timestamp', TimeType],
  ['int32', 'cookie'],
  ['uint8', 'notifyIfMissed', BoolType],
]);

var WakeupSetResultPacket = new struct([
  [Packet, 'packet'],
  ['int32', 'id'],
  ['int32', 'cookie'],
]);

var WakeupCancelPacket = new struct([
  [Packet, 'packet'],
  ['int32', 'id'],
]);

var WakeupEventPacket = new struct([
  [Packet, 'packet'],
  ['int32', 'id'],
  ['int32', 'cookie'],
]);

var WindowShowPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'type', WindowType],
  ['bool', 'pushing', BoolType],
]);

var WindowHidePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var WindowShowEventPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var WindowHideEventPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var WindowPropsPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'backgroundColor', Color],
  ['bool', 'fullscreen', BoolType],
  ['bool', 'scrollable', BoolType],
  ['uint8', 'statusBackgroundColor', Color],
  ['uint8', 'statusTextColor', Color],
]);

var WindowButtonConfigPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'buttonMask', ButtonFlagsType],
]);

var WindowActionBarPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'up', ImageType],
  ['uint32', 'select', ImageType],
  ['uint32', 'down', ImageType],
  ['uint8', 'action', BoolType],
  ['uint8', 'backgroundColor', Color],
]);

var ClickPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'button', ButtonType],
]);

var LongClickPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'button', ButtonType],
]);

var ImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['int16', 'width'],
  ['int16', 'height'],
  ['uint16', 'pixelsLength'],
  ['data', 'pixels'],
]);

var CardClearPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'flags'],
]);

var CardTextPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'index', CardTextType],
  ['uint8', 'color', Color],
  ['cstring', 'text'],
]);

var CardImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'image', ImageType],
  ['uint8', 'index', CardImageType],
]);

var CardStylePacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'style', CardStyleType],
]);

var VibePacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'type', VibeType],
]);

var LightPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'type', LightType],
]);

var AccelPeekPacket = new struct([
  [Packet, 'packet'],
]);

var AccelConfigPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'samples'],
  ['uint8', 'rate'],
  ['bool', 'subscribe', BoolType],
]);

var AccelData = new struct([
  ['int16', 'x'],
  ['int16', 'y'],
  ['int16', 'z'],
  ['bool', 'vibe'],
  ['uint64', 'time'],
]);

var AccelDataPacket = new struct([
  [Packet, 'packet'],
  ['bool', 'peek'],
  ['uint8', 'samples'],
]);

var AccelTapPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'axis'],
  ['int8', 'direction'],
]);

var MenuClearPacket = new struct([
  [Packet, 'packet'],
]);

var MenuClearSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
]);

var MenuPropsPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'sections', EnumerableType],
  ['uint8', 'backgroundColor', Color],
  ['uint8', 'textColor', Color],
  ['uint8', 'highlightBackgroundColor', Color],
  ['uint8', 'highlightTextColor', Color],
]);

var MenuSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'items', EnumerableType],
  ['uint16', 'titleLength', EnumerableType],
  ['cstring', 'title', StringType],
]);

var MenuGetSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
]);

var MenuItemPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
  ['uint32', 'icon', ImageType],
  ['uint16', 'titleLength', EnumerableType],
  ['uint16', 'subtitleLength', EnumerableType],
  ['cstring', 'title', StringType],
  ['cstring', 'subtitle', StringType],
]);

var MenuGetItemPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuSelectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
  ['uint8', 'align', MenuRowAlign],
  ['bool', 'animated', BoolType],
]);

var MenuGetSelectionPacket = new struct([
  [Packet, 'packet'],
]);

var MenuSelectionEventPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuSelectPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var MenuLongSelectPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'item'],
]);

var StageClearPacket = new struct([
  [Packet, 'packet'],
]);

var ElementInsertPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'type'],
  ['uint16', 'index'],
]);

var ElementRemovePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var GPoint = new struct([
  ['int16', 'x'],
  ['int16', 'y'],
]);

var GSize = new struct([
  ['int16', 'w'],
  ['int16', 'h'],
]);

var GRect = new struct([
  [GPoint, 'origin', PositionType],
  [GSize, 'size', SizeType],
]);

var ElementCommonPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  [GPoint, 'position', PositionType],
  [GSize, 'size', SizeType],
  ['uint8', 'backgroundColor', Color],
  ['uint8', 'borderColor', Color],
]);

var ElementRadiusPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint16', 'radius', EnumerableType],
]);

var ElementTextPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'updateTimeUnits', TimeUnits],
  ['cstring', 'text', StringType],
]);

var ElementTextStylePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint8', 'color', Color],
  ['uint8', 'textOverflow', TextOverflowMode],
  ['uint8', 'textAlign', TextAlignment],
  ['uint32', 'customFont'],
  ['cstring', 'systemFont', StringType],
]);

var ElementImagePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint32', 'image', ImageType],
  ['uint8', 'compositing', CompositingOp],
]);

var ElementAnimatePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  [GPoint, 'position', PositionType],
  [GSize, 'size', SizeType],
  ['uint32', 'duration'],
  ['uint8', 'easing', AnimationCurve],
]);

var ElementAnimateDonePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
]);

var VoiceDictationStartPacket = new struct([
  [Packet, 'packet'],
  ['bool', 'enableConfirmation'],
]);

var VoiceDictationStopPacket = new struct([
  [Packet, 'packet'],
]);

var VoiceDictationDataPacket = new struct([
  [Packet, 'packet'],
  ['int8', 'status'],
  ['cstring', 'transcription'],
]);

var CommandPackets = [
  Packet,
  SegmentPacket,
  ReadyPacket,
  LaunchReasonPacket,
  WakeupSetPacket,
  WakeupSetResultPacket,
  WakeupCancelPacket,
  WakeupEventPacket,
  WindowShowPacket,
  WindowHidePacket,
  WindowShowEventPacket,
  WindowHideEventPacket,
  WindowPropsPacket,
  WindowButtonConfigPacket,
  WindowActionBarPacket,
  ClickPacket,
  LongClickPacket,
  ImagePacket,
  CardClearPacket,
  CardTextPacket,
  CardImagePacket,
  CardStylePacket,
  VibePacket,
  LightPacket,
  AccelPeekPacket,
  AccelConfigPacket,
  AccelDataPacket,
  AccelTapPacket,
  MenuClearPacket,
  MenuClearSectionPacket,
  MenuPropsPacket,
  MenuSectionPacket,
  MenuGetSectionPacket,
  MenuItemPacket,
  MenuGetItemPacket,
  MenuSelectionPacket,
  MenuGetSelectionPacket,
  MenuSelectionEventPacket,
  MenuSelectPacket,
  MenuLongSelectPacket,
  StageClearPacket,
  ElementInsertPacket,
  ElementRemovePacket,
  ElementCommonPacket,
  ElementRadiusPacket,
  ElementTextPacket,
  ElementTextStylePacket,
  ElementImagePacket,
  ElementAnimatePacket,
  ElementAnimateDonePacket,
  VoiceDictationStartPacket,
  VoiceDictationStopPacket,
  VoiceDictationDataPacket,
];

var accelAxes = [
  'x',
  'y',
  'z',
];

var clearFlagMap = {
  action: (1 << 0),
  text: (1 << 1),
  image: (1 << 2),
};

/**
 * SimplyPebble object provides the actual methods to communicate with Pebble.
 *
 * It's an implementation of an abstract interface used by all the other classes.
 */

var SimplyPebble = {};

SimplyPebble.init = function() {
  // Register listeners for app message communication
  Pebble.addEventListener('appmessage', SimplyPebble.onAppMessage);

  // Register this implementation as the one currently in use
  simply.impl = SimplyPebble;

  state = SimplyPebble.state = {};

  state.timeOffset = new Date().getTimezoneOffset() * -60;

  // Initialize the app message queue
  state.messageQueue = new MessageQueue();

  // Initialize the packet queue
  state.packetQueue = new PacketQueue();

  // Signal the Pebble that the Phone's app message is ready
  SimplyPebble.ready();
};

/**
 * MessageQueue is an app message queue that guarantees delivery and order.
 */
var MessageQueue = function() {
  this._queue = [];
  this._sending = false;

  this._consume = this.consume.bind(this);
  this._cycle = this.cycle.bind(this);
};

MessageQueue.prototype.stop = function() {
  this._sending = false;
};

MessageQueue.prototype.consume = function() {
  this._queue.shift();
  if (this._queue.length === 0) {
    return this.stop();
  }
  this.cycle();
};

MessageQueue.prototype.checkSent = function(message, fn) {
  return function() {
    if (message === this._sent) {
      fn();
    }
  }.bind(this);
};

MessageQueue.prototype.cycle = function() {
  if (!this._sending) {
    return;
  }
  var head = this._queue[0];
  if (!head) {
    return this.stop();
  }
  this._sent = head;
  var success = this.checkSent(head, this._consume);
  var failure = this.checkSent(head, this._cycle);
  Pebble.sendAppMessage(head, success, failure);
};

MessageQueue.prototype.send = function(message) {
  this._queue.push(message);
  if (this._sending) {
    return;
  }
  this._sending = true;
  this.cycle();
};

var toByteArray = function(packet) {
  var type = CommandPackets.indexOf(packet);
  var size = Math.max(packet._size, packet._cursor);
  packet.packetType(type);
  packet.packetLength(size);

  var buffer = packet._view;
  var byteArray = new Array(size);
  for (var i = 0; i < size; ++i) {
    byteArray[i] = buffer.getUint8(i);
  }

  return byteArray;
};

/**
 * PacketQueue is a packet queue that combines multiple packets into a single packet.
 * This reduces latency caused by the time spacing between each app message.
 */
var PacketQueue = function() {
  this._message = [];

  this._send = this.send.bind(this);
};

PacketQueue.prototype._maxPayloadSize = (Platform.version() === 'aplite' ? 1024 : 2044) - 32;

PacketQueue.prototype.add = function(packet) {
  var byteArray = toByteArray(packet);
  if (this._message.length + byteArray.length > this._maxPayloadSize) {
    this.send();
  }
  Array.prototype.push.apply(this._message, byteArray);
  clearTimeout(this._timeout);
  this._timeout = setTimeout(this._send, 0);
};

PacketQueue.prototype.send = function() {
  if (this._message.length === 0) {
    return;
  }
  state.messageQueue.send({ 0: this._message });
  this._message = [];
};

SimplyPebble.sendMultiPacket = function(packet) {
  var byteArray = toByteArray(packet);
  var totalSize = byteArray.length;
  var segmentSize = state.packetQueue._maxPayloadSize - Packet._size;
  for (var i = 0; i < totalSize; i += segmentSize) {
    var isLast = (i + segmentSize) >= totalSize;
    var buffer = byteArray.slice(i, Math.min(totalSize, i + segmentSize));
    SegmentPacket.isLast((i + segmentSize) >= totalSize).buffer(buffer);
    state.packetQueue.add(SegmentPacket);
  }
};

SimplyPebble.sendPacket = function(packet) {
  if (packet._cursor < state.packetQueue._maxPayloadSize) {
    state.packetQueue.add(packet);
  } else {
    SimplyPebble.sendMultiPacket(packet);
  }
};

SimplyPebble.ready = function() {
  SimplyPebble.sendPacket(ReadyPacket);
};

SimplyPebble.wakeupSet = function(timestamp, cookie, notifyIfMissed) {
  WakeupSetPacket
    .timestamp(timestamp)
    .cookie(cookie)
    .notifyIfMissed(notifyIfMissed);
  SimplyPebble.sendPacket(WakeupSetPacket);
};

SimplyPebble.wakeupCancel = function(id) {
  SimplyPebble.sendPacket(WakeupCancelPacket.id(id === 'all' ? -1 : id));
};

SimplyPebble.windowShow = function(def) {
  SimplyPebble.sendPacket(WindowShowPacket.prop(def));
};

SimplyPebble.windowHide = function(id) {
  SimplyPebble.sendPacket(WindowHidePacket.id(id));
};

SimplyPebble.windowProps = function(def) {
  WindowPropsPacket
    .prop(def)
    .backgroundColor(def.backgroundColor || 'white');
  SimplyPebble.sendPacket(WindowPropsPacket);
};

SimplyPebble.windowButtonConfig = function(def) {
  SimplyPebble.sendPacket(WindowButtonConfigPacket.buttonMask(def));
};

var toActionDef = function(actionDef) {
  if (typeof actionDef === 'boolean') {
    actionDef = { action: actionDef };
  }
  return actionDef;
};

SimplyPebble.windowActionBar = function(def) {
  var actionDef = toActionDef(def);
  WindowActionBarPacket
    .up(actionDef.up)
    .select(actionDef.select)
    .down(actionDef.down)
    .action(typeof def === 'boolean' ? def : true)
    .backgroundColor(actionDef.backgroundColor || 'black');
  SimplyPebble.sendPacket(WindowActionBarPacket);
};

SimplyPebble.image = function(id, gbitmap) {
  SimplyPebble.sendPacket(ImagePacket.id(id).prop(gbitmap));
};

var toClearFlags = function(clear) {
  if (clear === true || clear === 'all') {
    clear = ~0;
  } else if (typeof clear === 'string') {
    clear = clearFlagMap[clear];
  } else if (typeof clear === 'object') {
    var flags = 0;
    for (var k in clear) {
      if (clear[k] === true) {
        flags |= clearFlagMap[k];
      }
    }
    clear = flags;
  }
  return clear;
};

SimplyPebble.cardClear = function(clear) {
  SimplyPebble.sendPacket(CardClearPacket.flags(toClearFlags(clear)));
};

SimplyPebble.cardText = function(field, text, color) {
  CardTextPacket
    .index(field)
    .color(color || 'clearWhite')
    .text(text || '');
  SimplyPebble.sendPacket(CardTextPacket);
};

SimplyPebble.cardImage = function(field, image) {
  SimplyPebble.sendPacket(CardImagePacket.index(field).image(image));
};

SimplyPebble.cardStyle = function(field, style) {
  SimplyPebble.sendPacket(CardStylePacket.style(style));
};

SimplyPebble.card = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'card', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyPebble.cardClear(clear);
  }
  SimplyPebble.windowProps(def);
  if (def.action !== undefined) {
    SimplyPebble.windowActionBar(def.action);
  }
  for (var k in def) {
    var textIndex = CardTextTypes.indexOf(k);
    if (textIndex !== -1) {
      SimplyPebble.cardText(k, def[k], def[CardTextColorTypes[textIndex]]);
    } else if (CardImageTypes.indexOf(k) !== -1) {
      SimplyPebble.cardImage(k, def[k]);
    } else if (k === 'style') {
      SimplyPebble.cardStyle(k, def[k]);
    }
  }
};

SimplyPebble.vibe = function(type) {
  SimplyPebble.sendPacket(VibePacket.type(type));
};

SimplyPebble.light = function(type) {
  SimplyPebble.sendPacket(LightPacket.type(type));
};

var accelListeners = [];

SimplyPebble.accelPeek = function(callback) {
  accelListeners.push(callback);
  SimplyPebble.sendPacket(AccelPeekPacket);
};

SimplyPebble.accelConfig = function(def) {
  SimplyPebble.sendPacket(AccelConfigPacket.prop(def));
};

SimplyPebble.voiceDictationStart = function(callback, enableConfirmation) {
  if (Platform.version() === 'aplite') {
    // If there is no microphone, call with an error event
    callback({
      'err': DictationSessionStatus[65],  // noMicrophone
      'failed': true,
      'transcription': null,
    });
    return;
  } else if (state.dictationCallback) {
    // If there's a transcription in progress, call with an error event
    callback({
      'err': DictationSessionStatus[64],  // dictationAlreadyInProgress
      'failed': true,
      'transcription': null,
    });
    return;
  }

  // Set the callback and send the packet
  state.dictationCallback = callback;
  SimplyPebble.sendPacket(VoiceDictationStartPacket.enableConfirmation(enableConfirmation));
};

SimplyPebble.voiceDictationStop = function() {
  // Send the message and delete the callback
  SimplyPebble.sendPacket(VoiceDictationStopPacket);
  delete state.dictationCallback;
};

SimplyPebble.onVoiceData = function(packet) {
  if (!state.dictationCallback) {
    // Something bad happened
    console.log("No callback specified for dictation session");
  } else {
    var e = {
      'err': DictationSessionStatus[packet.status()],
      'failed': packet.status() !== 0,
      'transcription': packet.transcription(),
    };
    // Invoke and delete the callback
    state.dictationCallback(e);
    delete state.dictationCallback;
  }
};

SimplyPebble.menuClear = function() {
  SimplyPebble.sendPacket(MenuClearPacket);
};

SimplyPebble.menuClearSection = function(section) {
  SimplyPebble.sendPacket(MenuClearSectionPacket.section(section));
};

SimplyPebble.menuProps = function(def) {
  SimplyPebble.sendPacket(MenuPropsPacket.prop(def));
};

SimplyPebble.menuSection = function(section, def, clear) {
  if (clear !== undefined) {
    SimplyPebble.menuClearSection(section);
  }
  MenuSectionPacket
    .section(section)
    .items(def.items)
    .titleLength(def.title)
    .title(def.title);
  SimplyPebble.sendPacket(MenuSectionPacket);
};

SimplyPebble.menuItem = function(section, item, def) {
  MenuItemPacket
    .section(section)
    .item(item)
    .icon(def.icon)
    .titleLength(def.title)
    .subtitleLength(def.subtitle)
    .title(def.title)
    .subtitle(def.subtitle);
  SimplyPebble.sendPacket(MenuItemPacket);
};

SimplyPebble.menuSelection = function(section, item, align) {
  if (section === undefined) {
    SimplyPebble.sendPacket(MenuGetSelectionPacket);
    return;
  }
  SimplyPebble.sendPacket(MenuSelectionPacket.section(section).item(item).align(align || 'center'));
};

SimplyPebble.menu = function(def, clear, pushing) {
  if (typeof pushing === 'boolean') {
    SimplyPebble.windowShow({ type: 'menu', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyPebble.menuClear();
  }
  SimplyPebble.windowProps(def);
  SimplyPebble.menuProps(def);
};

SimplyPebble.elementInsert = function(id, type, index) {
  SimplyPebble.sendPacket(ElementInsertPacket.id(id).type(type).index(index));
};

SimplyPebble.elementRemove = function(id) {
  SimplyPebble.sendPacket(ElementRemovePacket.id(id));
};

SimplyPebble.elementCommon = function(id, def) {
  ElementCommonPacket
    .id(id)
    .position(def.position)
    .size(def.size)
    .prop(def);
  SimplyPebble.sendPacket(ElementCommonPacket);
};

SimplyPebble.elementRadius = function(id, radius) {
  SimplyPebble.sendPacket(ElementRadiusPacket.id(id).radius(radius));
};

SimplyPebble.elementText = function(id, text, timeUnits) {
  SimplyPebble.sendPacket(ElementTextPacket.id(id).updateTimeUnits(timeUnits).text(text));
};

SimplyPebble.elementTextStyle = function(id, def) {
  ElementTextStylePacket.id(id).prop(def);
  var font = Font(def.font);
  if (typeof font === 'number') {
    ElementTextStylePacket.customFont(font).systemFont('');
  } else {
    ElementTextStylePacket.customFont(0).systemFont(font);
  }
  SimplyPebble.sendPacket(ElementTextStylePacket);
};

SimplyPebble.elementImage = function(id, image, compositing) {
  SimplyPebble.sendPacket(ElementImagePacket.id(id).image(image).compositing(compositing));
};

SimplyPebble.elementAnimate = function(id, def, animateDef, duration, easing) {
  ElementAnimatePacket
    .id(id)
    .position(animateDef.position || def.position)
    .size(animateDef.size || def.size)
    .duration(duration)
    .easing(easing);
  SimplyPebble.sendPacket(ElementAnimatePacket);
};

SimplyPebble.stageClear = function() {
  SimplyPebble.sendPacket(StageClearPacket);
};

SimplyPebble.stageElement = function(id, type, def, index) {
  if (index !== undefined) {
    SimplyPebble.elementInsert(id, type, index);
  }
  SimplyPebble.elementCommon(id, def);
  switch (type) {
    case StageElement.RectType:
    case StageElement.CircleType:
      SimplyPebble.elementRadius(id, def.radius);
      break;
    case StageElement.TextType:
      SimplyPebble.elementRadius(id, def.radius);
      SimplyPebble.elementTextStyle(id, def);
      SimplyPebble.elementText(id, def.text, def.updateTimeUnits);
      break;
    case StageElement.ImageType:
      SimplyPebble.elementRadius(id, def.radius);
      SimplyPebble.elementImage(id, def.image, def.compositing);
      break;
  }
};

SimplyPebble.stageRemove = SimplyPebble.elementRemove;

SimplyPebble.stageAnimate = SimplyPebble.elementAnimate;

SimplyPebble.stage = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyPebble.windowShow({ type: 'window', pushing: pushing });
  }
  SimplyPebble.windowProps(def);
  if (clear !== undefined) {
    SimplyPebble.stageClear();
  }
  if (def.action !== undefined) {
    SimplyPebble.windowActionBar(def.action);
  }
};

SimplyPebble.window = SimplyPebble.stage;

var toArrayBuffer = function(array, length) {
  length = length || array.length;
  var copy = new DataView(new ArrayBuffer(length));
  for (var i = 0; i < length; ++i) {
    copy.setUint8(i, array[i]);
  }
  return copy;
};

SimplyPebble.onLaunchReason = function(packet) {
  var reason = LaunchReasonTypes[packet.reason()];
  var args = packet.args();
  var remoteTime = packet.time();
  var isTimezone = packet.isTimezone();
  if (isTimezone) {
    state.timeOffset = 0;
  } else {
    var time = Date.now() / 1000;
    var resolution = 60 * 30;
    state.timeOffset = Math.round((remoteTime - time) / resolution) * resolution;
  }
  if (reason === 'timelineAction') {
    Timeline.emitAction(args);
  } else {
    Timeline.emitAction();
  }
  if (reason !== 'wakeup') {
    Wakeup.emitWakeup();
  }
};

SimplyPebble.onWakeupSetResult = function(packet) {
  var id = packet.id();
  switch (id) {
    case -8: id = 'range'; break;
    case -4: id = 'invalidArgument'; break;
    case -7: id = 'outOfResources'; break;
    case -3: id = 'internal'; break;
  }
  Wakeup.emitSetResult(id, packet.cookie());
};

SimplyPebble.onAccelData = function(packet) {
  var samples = packet.samples();
  var accels = [];
  AccelData._view = packet._view;
  AccelData._offset = packet._size;
  for (var i = 0; i < samples; ++i) {
    accels.push(AccelData.prop());
    AccelData._offset += AccelData._size;
  }
  if (!packet.peek()) {
    Accel.emitAccelData(accels);
  } else {
    var handlers = accelListeners;
    accelListeners = [];
    for (var j = 0, jj = handlers.length; j < jj; ++j) {
      Accel.emitAccelData(accels, handlers[j]);
    }
  }
};

SimplyPebble.onPacket = function(buffer, offset) {
  Packet._view = buffer;
  Packet._offset = offset;
  var packet = CommandPackets[Packet.type()];

  if (!packet) {
    console.log('Received unknown packet: ' + JSON.stringify(buffer));
    return;
  }

  packet._view = Packet._view;
  packet._offset = offset;
  switch (packet) {
    case LaunchReasonPacket:
      SimplyPebble.onLaunchReason(packet);
      break;
    case WakeupSetResultPacket:
      SimplyPebble.onWakeupSetResult(packet);
      break;
    case WakeupEventPacket:
      Wakeup.emitWakeup(packet.id(), packet.cookie());
      break;
    case WindowHideEventPacket:
      ImageService.markAllUnloaded();
      WindowStack.emitHide(packet.id());
      break;
    case ClickPacket:
      Window.emitClick('click', ButtonTypes[packet.button()]);
      break;
    case LongClickPacket:
      Window.emitClick('longClick', ButtonTypes[packet.button()]);
      break;
    case AccelDataPacket:
      SimplyPebble.onAccelData(packet);
      break;
    case AccelTapPacket:
      Accel.emitAccelTap(accelAxes[packet.axis()], packet.direction());
      break;
    case MenuGetSectionPacket:
      Menu.emitSection(packet.section());
      break;
    case MenuGetItemPacket:
      Menu.emitItem(packet.section(), packet.item());
      break;
    case MenuSelectPacket:
      Menu.emitSelect('menuSelect', packet.section(), packet.item());
      break;
    case MenuLongSelectPacket:
      Menu.emitSelect('menuLongSelect', packet.section(), packet.item());
      break;
    case MenuSelectionEventPacket:
      Menu.emitSelect('menuSelection', packet.section(), packet.item());
      break;
    case ElementAnimateDonePacket:
      StageElement.emitAnimateDone(packet.id());
      break;
    case VoiceDictationDataPacket:
      SimplyPebble.onVoiceData(packet);
      break;
  }
};

SimplyPebble.onAppMessage = function(e) {
  var data = e.payload[0];
  
  Packet._view = toArrayBuffer(data);

  var offset = 0;
  var length = data.length;

  do {
    SimplyPebble.onPacket(Packet._view, offset);

    Packet._offset = offset;
    offset += Packet.length();
  } while (offset !== 0 && offset < length);
};

module.exports = SimplyPebble;

