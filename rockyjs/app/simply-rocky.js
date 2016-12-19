var Color = require('../../src/js/lib/color');
var struct = require('../../src/js/lib/struct');
var util2 = require('../../src/js/lib/util2');
var myutil = require('../../src/js/lib/myutil');
var Platform = require('../../src/js/platform');
var Wakeup = require('../../src/js/wakeup');
var Timeline = require('../../src/js/timeline');
var Resource = require('../../src/js/ui/resource');
var Accel = require('../../src/js/ui/accel');
var Voice = require('../../src/js/ui/voice');
var ImageService = require('../../src/js/ui/imageservice');
var WindowStack = require('../../src/js/ui/windowstack');
var Window = require('../../src/js/ui/window');
var Menu = require('../../src/js/ui/menu');
var StageElement = require('../../src/js/ui/element');
var Vector2 = require('../../src/js/lib/vector2');

var simply = require('../../src/js/ui/simply');
//var ImageResources = require('../../src/js/image-resources');


/**
 * This package provides the underlying implementation for the ui/* classes.
 *
 * This implementation uses Rocky JS to render to a canvas.
 */

/**
 * First part of this file is defining the commands and types that we will use later.
 */

var state;

var BoolType = function(x) {
  return x ? 1 : 0;
};

var StringType = function(x) {
  return (x === undefined) ? '' : '' + x;
};

var UTF8ByteLength = function(x) {
  return unescape(encodeURIComponent(x)).length;
};

var EnumerableType = function(x) {
  if (x && x.hasOwnProperty('length')) {
    return x.length;
  }
  return x ? Number(x) : 0;
};

var StringLengthType = function(x) {
  return UTF8ByteLength(StringType(x));
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

var namedColorMapUpper = (function() {
  var map = {};
  for (var k in namedColorMap) {
    map[k.toUpperCase()] = namedColorMap[k];
  }
  return map;
})();

var ColorType = function(color) {
  if (typeof color === 'string') {
    var name = myutil.toCConstantName(color);
    name = name.replace(/_+/g, '');
    if (name in namedColorMapUpper) {
      return namedColorMapUpper[name];
    }
  }
  var argb = Color.toArgbUint8(color);
  if ((argb & 0xc0) === 0 && argb !== 0) {
    argb = argb | 0xc0;
  }
  return argb;
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
  'classic-small',
  'classic-large',
  'mono',
  'small',
  'large',
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

var StatusBarSeparatorModeTypes = [
  'none',
  'dotted',
];

var StatusBarSeparatorModeType = makeArrayType(StatusBarSeparatorModeTypes);

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
  ['uint8', 'backgroundColor', ColorType],
  ['bool', 'scrollable', BoolType],
  ['bool', 'paging', BoolType],
]);

var WindowButtonConfigPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'buttonMask', ButtonFlagsType],
]);

var WindowStatusBarPacket = new struct([
  [Packet, 'packet'],
  ['uint8', 'backgroundColor', ColorType],
  ['uint8', 'color', ColorType],
  ['uint8', 'separator', StatusBarSeparatorModeType],
  ['uint8', 'status', BoolType],
]);

var WindowActionBarPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'up', ImageType],
  ['uint32', 'select', ImageType],
  ['uint32', 'down', ImageType],
  ['uint8', 'backgroundColor', ColorType],
  ['uint8', 'action', BoolType],
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
  ['uint8', 'color', ColorType],
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
  ['uint8', 'backgroundColor', ColorType],
  ['uint8', 'textColor', ColorType],
  ['uint8', 'highlightBackgroundColor', ColorType],
  ['uint8', 'highlightTextColor', ColorType],
]);

var MenuSectionPacket = new struct([
  [Packet, 'packet'],
  ['uint16', 'section'],
  ['uint16', 'items', EnumerableType],
  ['uint8', 'backgroundColor', ColorType],
  ['uint8', 'textColor', ColorType],
  ['uint16', 'titleLength', StringLengthType],
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
  ['uint16', 'titleLength', StringLengthType],
  ['uint16', 'subtitleLength', StringLengthType],
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
  ['uint16', 'borderWidth', EnumerableType],
  ['uint8', 'backgroundColor', ColorType],
  ['uint8', 'borderColor', ColorType],
]);

var ElementRadiusPacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint16', 'radius', EnumerableType],
]);

var ElementAnglePacket = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint16', 'angle', EnumerableType],
]);

var ElementAngle2Packet = new struct([
  [Packet, 'packet'],
  ['uint32', 'id'],
  ['uint16', 'angle2', EnumerableType],
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
  ['uint8', 'color', ColorType],
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
 * SimplyRocky object provides the actual methods to render on the canvas.
 *
 * It's an implementation of an abstract interface used by all the other classes.
 */

var SimplyRocky = {};

SimplyRocky.init = function() {

  // Register this implementation as the one currently in use
  simply.impl = SimplyRocky;

  state = SimplyRocky.state = {};

  state.timeOffset = new Date().getTimezoneOffset() * -60;

  var clickStartTime, clickEndTime, longPress;
  ButtonTypes.forEach(function(button) {
    document.getElementById(button).onclick = function() {
      var clickType;
      if (WindowStack.top() instanceof Menu) {
        var menu = WindowStack.top();
        switch (button) {
          case "select":
                return Menu.emitSelect(longPress ? 'menuLongSelect' : 'menuSelect', menu._selection.sectionIndex,  menu._selection.itemIndex);
          case "up":
                menu._selection.itemIndex > 0 ? menu._selection.itemIndex-- : null;
                SimplyRocky.stageClear();
                SimplyRocky.menuSelection(menu._selection.sectionIndex, menu._selection.itemIndex);
                SimplyRocky.markDirty();
                return;
          case "down":
                var itemsLength = menu.state.sections[ menu._selection.sectionIndex].items.length;
                menu._selection.itemIndex < itemsLength-1 ? menu._selection.itemIndex++ : null;
                SimplyRocky.stageClear();
                SimplyRocky.menuSelection(menu._selection.sectionIndex, menu._selection.itemIndex);
                SimplyRocky.markDirty();
                return;
          case "back":
                return SimplyRocky.menuRemove();

        }

      } else {
        var handled = Window.emitClick(longPress ? 'longClick' : 'click', button);
        if ( button == "back" && !handled) {
          WindowStack.remove(WindowStack.top());
        }
        SimplyRocky.markDirty();
      }

    };


    document.getElementById(button).onmousedown = function () {
      clickStartTime = new Date().getTime();
    };

    document.getElementById(button).onmouseup = function () {
      clickEndTime = new Date().getTime();
      longPress = (clickEndTime - clickStartTime < 1000) ? false : true;
    };

  });



  // Signal the Pebble that the Phone's app message is ready
  SimplyRocky.ready();
};

/**
 * MessageQueue is an app message queue that guarantees delivery and order.
 */
/*var MessageQueue = function() {
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
};*/

/**
 * PacketQueue is a packet queue that combines multiple packets into a single packet.
 * This reduces latency caused by the time spacing between each app message.
 */
/*var PacketQueue = function() {
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

SimplyRocky.sendMultiPacket = function(packet) {
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
 */

SimplyRocky.ready = function() {
  //SimplyRocky.sendPacket(ReadyPacket);
};

SimplyRocky.wakeupSet = function(timestamp, cookie, notifyIfMissed) {
  WakeupSetPacket
    .timestamp(timestamp)
    .cookie(cookie)
    .notifyIfMissed(notifyIfMissed);
  //SimplyRocky.sendPacket(WakeupSetPacket);
};

SimplyRocky.wakeupCancel = function(id) {
  WakeupCancelPacket.id(id === 'all' ? -1 : id);
  //SimplyRocky.sendPacket(WakeupCancelPacket.id(id === 'all' ? -1 : id));
};

SimplyRocky.windowShow = function(def) {
  // does nothing useful?
  //WindowShowPacket.prop(def);
  //SimplyRocky.sendPacket(WindowShowPacket.prop(def));
};

SimplyRocky.windowHide = function(id) {
  WindowHidePacket.id(id);
  //SimplyRocky.sendPacket(WindowHidePacket.id(id));
};

SimplyRocky.windowProps = function(def) {
  def.position = { x : 0, y : 0};
  def.size = {x : 144, y : 168};
  SimplyRocky.drawShape(def);
};

SimplyRocky.windowButtonConfig = function(def) {
  WindowButtonConfigPacket.buttonMask(def);
  //SimplyRocky.sendPacket(WindowButtonConfigPacket.buttonMask(def));
};

var toStatusDef = function(statusDef) {
  if (typeof statusDef === 'boolean') {
    statusDef = { status: statusDef };
  }
  return statusDef;
};

SimplyRocky.windowStatusBar = function(def) {
  var statusDef = toStatusDef(def);
  WindowStatusBarPacket
    .separator(statusDef.separator || 'dotted')
    .status(typeof def === 'boolean' ? def : def.status !== false)
    .color(statusDef.color || 'black')
    .backgroundColor(statusDef.backgroundColor || 'white');
  //SimplyRocky.sendPacket(WindowStatusBarPacket);
};

SimplyRocky.windowStatusBarCompat = function(def) {
  if (typeof def.fullscreen === 'boolean') {
    SimplyRocky.windowStatusBar(!def.fullscreen);
  } else if (def.status !== undefined) {
    SimplyRocky.windowStatusBar(def.status);
  }
};

var toActionDef = function(actionDef) {
  if (typeof actionDef === 'boolean') {
    actionDef = { action: actionDef };
  }
  return actionDef;
};

SimplyRocky.windowActionBar = function(def) {
  var actionDef = toActionDef(def);
  WindowActionBarPacket
    .up(actionDef.up)
    .select(actionDef.select)
    .down(actionDef.down)
    .action(typeof def === 'boolean' ? def : def.action !== false)
    .backgroundColor(actionDef.backgroundColor || 'black');
  //SimplyRocky.sendPacket(WindowActionBarPacket);
};

SimplyRocky.image = function(id, gbitmap) {
  ImagePacket.id(id).prop(gbitmap);
  //SimplyRocky.sendPacket(ImagePacket.id(id).prop(gbitmap));
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

SimplyRocky.cardClear = function(clear) {
  CardClearPacket.flags(toClearFlags(clear));
  //SimplyRocky.sendPacket(CardClearPacket.flags(toClearFlags(clear)));
};

SimplyRocky.cardText = function(field, text, color) {
  CardTextPacket
    .index(field)
    .color(color || 'clearWhite')
    .text(text || '');
  //SimplyRocky.sendPacket(CardTextPacket);
};

SimplyRocky.cardImage = function(field, image) {
  CardImagePacket.index(field).image(image);
  //SimplyRocky.sendPacket(CardImagePacket.index(field).image(image));
};

SimplyRocky.cardStyle = function(field, style) {
  CardStylePacket.style(style);
  //SimplyRocky.sendPacket(CardStylePacket.style(style));
};

SimplyRocky.card = function(def, clear, pushing) {
  if (arguments.length === 3) {
    SimplyRocky.windowShow({ type: 'card', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyRocky.cardClear(clear);
  }
  SimplyRocky.windowProps(def);
  SimplyRocky.windowStatusBarCompat(def);
  if (def.action !== undefined) {
    SimplyRocky.windowActionBar(def.action);
  }
  for (var k in def) {
    var textIndex = CardTextTypes.indexOf(k);
    if (textIndex !== -1) {
      SimplyRocky.cardText(k, def[k], def[CardTextColorTypes[textIndex]]);
    } else if (CardImageTypes.indexOf(k) !== -1) {
      SimplyRocky.cardImage(k, def[k]);
    } else if (k === 'style') {
      SimplyRocky.cardStyle(k, def[k]);
    }
  }
};

SimplyRocky.vibe = function(type) {
  VibePacket.type(type);
  //SimplyRocky.sendPacket(VibePacket.type(type));
};

SimplyRocky.light = function(type) {
  LightPacket.type(type);
  //SimplyRocky.sendPacket(LightPacket.type(type));
};

var accelListeners = [];

SimplyRocky.accelPeek = function(callback) {
  accelListeners.push(callback);
  //SimplyRocky.sendPacket(AccelPeekPacket);
};

SimplyRocky.accelConfig = function(def) {
  AccelConfigPacket.prop(def);
  //SimplyRocky.sendPacket(AccelConfigPacket.prop(def));
};

SimplyRocky.voiceDictationStart = function(callback, enableConfirmation) {
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
  VoiceDictationStartPacket.enableConfirmation(enableConfirmation);
  //SimplyRocky.sendPacket(VoiceDictationStartPacket.enableConfirmation(enableConfirmation));
};

SimplyRocky.voiceDictationStop = function() {
  // Send the message and delete the callback
  //SimplyRocky.sendPacket(VoiceDictationStopPacket);
  delete state.dictationCallback;
};

SimplyRocky.onVoiceData = function(packet) {
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

SimplyRocky.menuClear = function() {
  SimplyRocky.menuState = {
    currentMenuItems : []
  };
  SimplyRocky.stageClear();
};

SimplyRocky.menuClearSection = function(section) {
  MenuClearSectionPacket.section(section);
  //SimplyRocky.sendPacket(MenuClearSectionPacket.section(section));
};

SimplyRocky.menuProps = function(def) {
  MenuPropsPacket.prop(def);
};

SimplyRocky.menuSection = function(section, def, clear) {
  if (clear !== undefined) {
    SimplyRocky.menuClearSection(section);
  }
  MenuSectionPacket
    .section(section)
    .items(def.items)
    .backgroundColor(def.backgroundColor)
    .textColor(def.textColor)
    .titleLength(def.title)
    .title(def.title);
  //SimplyRocky.sendPacket(MenuSectionPacket);

  SimplyRocky.menuState.currentMenuItems = def.items;
};

SimplyRocky.menuItem = function(section, item, def) {
  MenuItemPacket
    .section(section)
    .item(item)
    .icon(def.icon)
    .titleLength(def.title)
    .subtitleLength(def.subtitle)
    .title(def.title)
    .subtitle(def.subtitle);
  //SimplyRocky.sendPacket(MenuItemPacket);

  SimplyRocky.menuState.currentMenuItems[item] = def;
};

SimplyRocky.menuSelection = function(section, selectedItem, align) {

  var maxRenderIndex = Math.min(SimplyRocky.menuState.currentMenuItems.length - 1, 3);
  var renderWindow = SimplyRocky.menuState.currentRenderWindow || new Vector2(0, maxRenderIndex);

  if (selectedItem < renderWindow.x) {
    renderWindow = new Vector2(selectedItem, Math.min(maxRenderIndex, selectedItem + 3));
  }
  if (selectedItem > renderWindow.y) {
    renderWindow = new Vector2(selectedItem - 3, selectedItem);
  }
  SimplyRocky.menuState.currentRenderWindow = renderWindow;

  for(var item = renderWindow.x; item <= renderWindow.y; item++) {
    var def = SimplyRocky.menuState.currentMenuItems[item];
    var isSelected = item == selectedItem;
    var renderAt = item - renderWindow.x;

    var MENU_HEIGHT = 168 / 4;
    var PADDING = 10;
    var outer = {
      backgroundColor : 'black',
      position : {
        x : 0,
        y : (MENU_HEIGHT * renderAt)
      },
      size : {
        x : 143,
        y : MENU_HEIGHT
      }
    };
    SimplyRocky.drawShape(outer);

    var inner = {
      backgroundColor : isSelected ? 'black' : 'white',
      position : {
        x : 1,
        y : (MENU_HEIGHT * renderAt)
      },
      size : {
        x : 143 - 2,
        y : MENU_HEIGHT - 1
      }
    };

    if ( renderAt == 0) {
      //special rendering for the first
      inner.position.y++;
      inner.size.y--;
    }

    SimplyRocky.drawShape(inner);

    var textDef = {
      text : def.title,
      font : "gothic-18",
      color : isSelected ? 'white' : 'black',
      textAlign : "left",
      position : {
        x : PADDING,
        y : outer.position.y + PADDING
      },
      size : {
        x : outer.size.x - PADDING - PADDING,
        y : outer.size.y - PADDING - PADDING,
      }
    };
    SimplyRocky.drawText(textDef);
  }
};

SimplyRocky.menu = function(def, clear, pushing) {
  if (typeof pushing === 'boolean') {
    SimplyRocky.windowShow({ type: 'menu', pushing: pushing });
  }
  if (clear !== undefined) {
    SimplyRocky.menuClear();
  }
  SimplyRocky.windowProps(def);
  SimplyRocky.windowStatusBarCompat(def);
  SimplyRocky.menuProps(def);
};

SimplyRocky.menuRemove = function() {
  WindowStack.pop();
  SimplyRocky.markDirty();
}

SimplyRocky.elementInsert = function(def, id, type, index) {
  //SimplyRocky.sendPacket(ElementInsertPacket.id(id).type(type).index(index));
};

SimplyRocky.elementRemove = function(id) {
  ElementRemovePacket.id(id);
  //SimplyRocky.sendPacket(ElementRemovePacket.id(id));
};

SimplyRocky.elementFrame = function(packet, def, altDef) {
  var position = def.position || (altDef ? altDef.position : undefined);
  var position2 = def.position2 || (altDef ? altDef.position2 : undefined);
  var size = def.size || (altDef ? altDef.size : undefined);
  if (position && position2) {
    size = position2.clone().subSelf(position);
  }
  packet.position(position);
  packet.size(size);
};

SimplyRocky.elementCommon = function(id, def) {
  if ('strokeColor' in def) {
    ElementCommonPacket.borderColor(def.strokeColor);
  }
  if ('strokeWidth' in def) {
    ElementCommonPacket.borderWidth(def.strokeWidth);
  }
  SimplyRocky.elementFrame(ElementCommonPacket, def);
  ElementCommonPacket
    .id(id)
    .prop(def);
  //SimplyRocky.sendPacket(ElementCommonPacket);
};

SimplyRocky.elementRadius = function(id, def) {
  ElementRadiusPacket.id(id).radius(def.radius)
  //SimplyRocky.sendPacket(ElementRadiusPacket.id(id).radius(def.radius));
};

SimplyRocky.elementAngle = function(id, def) {
  ElementAnglePacket.id(id).angle(def.angleStart || def.angle);
  //SimplyRocky.sendPacket(ElementAnglePacket.id(id).angle(def.angleStart || def.angle));
};

SimplyRocky.elementAngle2 = function(id, def) {
  ElementAngle2Packet.id(id).angle2(def.angleEnd || def.angle2);
  //SimplyRocky.sendPacket(ElementAngle2Packet.id(id).angle2(def.angleEnd || def.angle2));
};

SimplyRocky.elementText = function(id, text, timeUnits) {
  ElementTextPacket.id(id).updateTimeUnits(timeUnits).text(text);
  //SimplyRocky.sendPacket(ElementTextPacket.id(id).updateTimeUnits(timeUnits).text(text));
};

SimplyRocky.elementTextStyle = function(id, def) {
  ElementTextStylePacket.id(id).prop(def);
  var font = Font(def.font);
  if (typeof font === 'number') {
    ElementTextStylePacket.customFont(font).systemFont('');
  } else {
    ElementTextStylePacket.customFont(0).systemFont(font);
  }
  //SimplyRocky.sendPacket(ElementTextStylePacket)
};

SimplyRocky._padLeft = function(n) {
  return n < 9 ? "0" + n : n;
}
SimplyRocky.drawText = function(def) {

  if (def.updateTimeUnits) {
    var intervalFn = function () {
      // this is a time field
      var date = new Date();
      var dateValue = [];
      if (def.updateTimeUnits.hours) {
        dateValue.push(SimplyRocky._padLeft(date.getHours()));
      }
      if (def.updateTimeUnits.minutes) {
        dateValue.push(SimplyRocky._padLeft(date.getMinutes()));
      }
      if (def.updateTimeUnits.seconds) {
        dateValue.push(SimplyRocky._padLeft(date.getSeconds));
      }

      def.text = dateValue.join(":");
      simply.impl.markDirty();
    };
    intervalFn();

    //setInterval(intervalFn, 1000);
  }

  var fn = function(ctx, bounds) {
    console.log("drawing text " + JSON.stringify(def));
    var rocky = Rocky.rockyCanvas;

    var font = rocky.fonts_get_system_font(Rocky.rockyCanvas['FONT_KEY_' + def.font.toUpperCase().split("-").join("_")]);
    rocky.graphics_context_set_text_color(ctx, namedColorMap[def.color]);
    rocky.graphics_draw_text(ctx, "" + def.text, font, [def.position.x, def.position.y, def.size.x, def.size.y], 0, TextAlignment(def.textAlign));
  };

  theStage.push({ render : fn });
};

SimplyRocky.drawImage = function(def) {
  var fn = function (ctx, bounds) {
    var cx = Rocky.jscanvas;
    var rocky = Rocky.rockyCanvas;

    var bitmap = rocky.gdraw_command_image_create_with_data(ImageResources[def.image]);
    rocky.gdraw_command_image_draw(ctx, bitmap, [def.position.x, def.position.y]);
  };

  //theStage.push(fn);
};

SimplyRocky.drawShape = function(def) {
  var fn = function (ctx, bounds) {
    console.log("drawing shape " + JSON.stringify(def))
    var cx = Rocky.jscanvas;
    var rocky = Rocky.rockyCanvas;

    var bgColor = def.backgroundColor || 'black';
    rocky.graphics_context_set_fill_color(ctx, namedColorMap[bgColor]);
    rocky.graphics_fill_rect(ctx, [def.position.x, def.position.y, def.size.x, def.size.y]);


  };

  theStage.push({ render : fn });
};

SimplyRocky.elementImage = function(id, image, compositing) {
  ElementImagePacket.id(id).image(image).compositing(compositing);
  //SimplyRocky.sendPacket(ElementImagePacket.id(id).image(image).compositing(compositing));
};



SimplyRocky.elementAnimate = function(id, def, animateDef, duration, easing) {
  SimplyRocky.elementFrame(ElementAnimatePacket, animateDef, def);
  ElementAnimatePacket
    .id(id)
    .duration(duration)
    .easing(easing);
  //SimplyRocky.sendPacket(ElementAnimatePacket);
};

SimplyRocky.stageClear = function() {
  theStage.length = 0;
};

SimplyRocky.stageElement = function(id, type, def, index) {
  SimplyRocky.elementCommon(id, def);
  switch (type) {
    case StageElement.RectType:
    case StageElement.CircleType:
      SimplyRocky.elementRadius(id, def);
      SimplyRocky.drawShape(def);
      break;
    case StageElement.RadialType:
      SimplyRocky.elementRadius(id, def);
      SimplyRocky.elementAngle(id, def);
      SimplyRocky.elementAngle2(id, def);
      break;
    case StageElement.TextType:
      SimplyRocky.elementRadius(id, def);
      SimplyRocky.elementTextStyle(id, def);
      SimplyRocky.elementText(id, def.text, def.updateTimeUnits);
      SimplyRocky.drawText(def);
      break;
    case StageElement.ImageType:
      SimplyRocky.elementRadius(id, def);
      SimplyRocky.elementImage(id, def.image, def.compositing);
      SimplyRocky.drawImage(def);
      break;
  }
  if (index !== undefined) {
    SimplyRocky.elementInsert(def, id, type, index);
  }
};

SimplyRocky.stageRemove = SimplyRocky.elementRemove;

SimplyRocky.stageAnimate = SimplyRocky.elementAnimate;

SimplyRocky.stage = function(def, clear, pushing) {
  if (clear !== undefined) {
    SimplyRocky.stageClear();
  }

  if (arguments.length === 3) {
    SimplyRocky.windowShow({ type: 'window', pushing: pushing });
  }
  SimplyRocky.windowProps(def);
  SimplyRocky.windowStatusBarCompat(def);
  if (def.action !== undefined) {
    SimplyRocky.windowActionBar(def.action);
  }
};

SimplyRocky.window = SimplyRocky.stage;

var toArrayBuffer = function(array, length) {
  length = length || array.length;
  var copy = new DataView(new ArrayBuffer(length));
  for (var i = 0; i < length; ++i) {
    copy.setUint8(i, array[i]);
  }
  return copy;
};

SimplyRocky.onLaunchReason = function(packet) {
  /*var reason = LaunchReasonTypes[packet.reason()];
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
  }*/
};

SimplyRocky.onWakeupSetResult = function(packet) {
  /*var id = packet.id();
  switch (id) {
    case -8: id = 'range'; break;
    case -4: id = 'invalidArgument'; break;
    case -7: id = 'outOfResources'; break;
    case -3: id = 'internal'; break;
  }
  Wakeup.emitSetResult(id, packet.cookie());*/
};

SimplyRocky.onAccelData = function(packet) {
  /*var samples = packet.samples();
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
  }*/
};

var theStage = [];

Rocky.rockyCanvas = Rocky.bindCanvas(document.getElementById("pebble"));

Rocky.rockyCanvas.update_proc = function (ctx, bounds) {
  for(var i = 0; i < theStage.length; i++) {
      try {
        console.log("drawing index " + i);
        theStage[i].render(ctx, bounds);
      } catch (e) {
        console.log(e);
      }
  }

}

SimplyRocky.markDirty = function() {
  Rocky.activeBinding.mark_dirty();
}

module.exports = SimplyRocky;

