Pebble.js
=========

[![Build Status](https://travis-ci.org/pebble/pebblejs.svg?branch=master)](https://travis-ci.org/pebble/pebblejs)

Pebble.js lets you write beautiful Pebble applications completely in JavaScript.

Pebble.js applications run on your phone. They have access to all the resources of your phone (internet connectivity, GPS, almost unlimited memory, etc). Because they are written in JavaScript they are also perfect to make HTTP requests and connect your Pebble to the internet.

**Warning:** Pebble.js is still in beta, so breaking API changes are possible. Pebble.js is best suited for prototyping and applications that inherently require communication in response to user actions, such as accessing the internet. Please be aware that as a result of Bluetooth round-trips for all actions, Pebble.js apps will use more power and respond slower to user interaction than a similar native app.

> ![JSConf 2014](http://2014.jsconf.us/img/logo.png)
>
> Pebble.js was announced during JSConf 2014!

## Getting Started

 * In CloudPebble

   The easiest way to use Pebble.js is in [CloudPebble](https://cloudpebble.net). Select the 'Pebble.js' project type when creating a new project.

   [Build a Pebble.js application now in CloudPebble >](https://cloudpebble.net)

 * With the Pebble SDK

   This option allows you to customize Pebble.js. Follow the [Pebble SDK installation instructions](https://developer.pebble.com/sdk/install/) to install the SDK on your computer and [fork this project](http://github.com/pebble/pebblejs) on Github. 
   
   The main entry point for your application is in the `src/js/app.js` file. For projects with multiple files, you may move `src/js/app.js` to `src/js/app/index.js` instead and create new files under `src/js/app`.

   [Install the Pebble SDK on your computer >](http://developer.pebble.com/sdk/install/)


Pebble.js applications follow modern JavaScript best practices. To get started, you just need to call `require('ui')` to load the UI module and start building user interfaces.

````js
var UI = require('ui');
````

The basic block to build user interface is the [Card]. A Card is a type of [Window] that occupies the entire screen and allows you to display some text in a pre-structured way: a title at the top, a subtitle below it and a body area for larger paragraphs. Cards can be made scrollable to display large quantities of information. You can also add images next to the title, subtitle or in the body area.

````js
var card = new UI.Card({
  title: 'Hello World',
  body: 'This is your first Pebble app!',
  scrollable: true
});
````

After creating a card window, push it onto the screen with the `show()` method.

````js
card.show();
````

To interact with the users, use the buttons or the accelerometer. Add callbacks to a window with the `.on()` method:

````js
card.on('click', function(e) {
  card.subtitle('Button ' + e.button + ' pressed.');
});
````

Making HTTP connections is very easy with the included `ajax` library.

````js
var ajax = require('ajax');
ajax({ url: 'http://api.theysaidso.com/qod.json', type: 'json' },
  function(data) {
    card.body(data.contents.quote);
    card.title(data.contents.author);
  }
);
````

You can do much more with Pebble.js:

 - Get accelerometer values
 - Display complex UI mixing geometric elements, text and images
 - Animate elements on the screen
 - Display arbitrary long menus
 - Use the GPS and LocalStorage on the phone
 - etc!

Keep reading for the full [API Reference].

## Using Images

You can use images in your Pebble.js application. Currently all images must be embedded in your applications. They will be resized and converted to black and white when you build your project.

We recommend that you follow these guidelines when preparing your images for Pebble:

 * Resize all images for the screen of Pebble. A fullscreen image will be 144 pixels wide by 168 pixels high.
 * Use an image editor or [HyperDither](http://2002-2010.tinrocket.com/software/hyperdither/index.html) to dither your image in black and white.
 * Remember that the maximum size for a Pebble application is 100kB. You will quickly reach that limit if you add too many images.

To add an image in your application, edit the `appinfo.json` file and add your image:

````js
{
  "type": "png",
  "name": "IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER",
  "file": "images/your_image.png"
}
````

> If you are using CloudPebble, you can add images in your project configuration.

To reference your image in Pebble.js, you can use the `name` field or the `file` field.

````js
// These two examples are both valid ways to show the image declared above in a Card
card.icon('images/your_image.png');
card.icon('IMAGE_CHOOSE_A_UNIQUE_IDENTIFIER');
````

You can also display images with [Image] when using a dynamic [Window].

````js
// This is an example of using an image with Image and Window
var UI = require('ui');
var Vector2 = require('vector2');

var wind = new UI.Window({ fullscreen: true });
var image = new UI.Image({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  image: 'images/your_image.png'
});
wind.add(image);
wind.show();
````

## Using Fonts

You can use any of the Pebble system fonts in your Pebble.js applications. Please refer to [this Pebble Developer's blog post](https://developer.pebble.com/blog/2013/07/24/Using-Pebble-System-Fonts/) for a list of all the Pebble system fonts. When referring to a font, using lowercase with dashes is recommended. For example, `GOTHIC_18_BOLD` becomes `gothic-18-bold`.

````js
var Vector2 = require('vector2');

var wind = new UI.Window();
var textfield = new UI.Text({
 position: new Vector2(0, 0),
 size: new Vector2(144, 168),
 font: 'gothic-18-bold',
 text: 'Gothic 18 Bold'
});
wind.add(textfield);
wind.show();
````

# API Reference

## Global namespace

### require(path)

Loads another JavaScript file allowing you to write a multi-file project. Package loading loosely follows the CommonJS format. `path` is the path to the dependency.

````js
// src/js/dependency.js
var dep = require('dependency');
````

Exporting is possible by modifying or setting `module.exports` within the required file. The module path is also available as `module.filename`. `require` will look for the module relative to the loading module, the root path, and the Pebble.js library folder `lib` located at `src/js/lib`.

### Pebble

The `Pebble` object from [PebbleKit JavaScript](https://developer.pebble.com/guides/pebble-apps/pebblekit-js/) is available as a global variable. Its usage is discouraged in Pebble.js, instead you should use the objects documented below who provide a cleaner object interface to the same functionalities.

### window -- browser

A `window` object is provided with a subset of the standard APIs you would find in a normal browser. Its direct usage is discouraged because available functionalities may differ between the iOS and Android runtime environment. 

More specifically:

 - XHR and WebSocket are supported on iOS and Android
 - The `<canvas>` element is not available on iOS

If in doubt, please contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com).

## Clock

The Clock module makes working with the Wakeup module with time utility functions.

### Clock

`Clock` provides a single module of the same name `Clock`.

````js
var Clock = require('clock');
````

<a id="clock-weekday"></a>
#### Clock.weekday(weekday, hour, minute[, seconds])
[Clock.weekday]: #clock-weekday

Calculates the seconds since the epoch until the next nearest moment of the given weekday and time parameters. `weekday` can either be a string representation of the weekday name such as `sunday`, or the 0-based index number, such as 0 for sunday. `hour` is a number 0-23 with 0-12 indicating the morning or a.m. times. `minute` and `seconds` numbers 0-59. `seconds` is optional.

The weekday is always the next occurrence and is not limited by the current week. For example, if today is Wednesday, and `'tuesday'` is given for `weekday`, the resulting time will be referring to Tuesday of next week at least 5 days from now. Similarly, if today is Wednesday and `'Thursday'` is given, the time will be referring to tomorrow, the Thursday of the same week, between 0 to 2 days from now. This is useful for specifying the time for [Wakeup.schedule].

````js
// Next Tuesday at 6:00 a.m.
var nextTime = Clock.weekday('tuesday', 6, 0);
console.log('Seconds until then: ' + (nextTime - Date.now()));

var Wakeup = require('wakeup');

// Schedule a wakeup event.
Wakeup.schedule(
  { time: nextTime },
  function(e) {
    if (e.failed) {
      console.log('Wakeup set failed: ' + e.error);
    } else {
      console.log('Wakeup set! Event ID: ' + e.id);
    }
  }
)
````

## Settings

The Settings module allows you to add a configurable web view to your application and share options with it. Settings also provides two data accessors `Settings.option` and `Settings.data` which are backed by localStorage. Data stored in `Settings.option` is automatically shared with the configurable web view.

### Settings

`Settings` provides a single module of the same name `Settings`.

````js
var Settings = require('settings');
````

#### Settings.config(options, [open,] close)

`Settings.config` registers your configurable for use along with `open` and `close` handlers.

`options` is an object with the following parameters:

| Name       | Type    | Argument   | Default   | Description                                                                        |
| ----       | :----:  | :--------: | --------- | -------------                                                                      |
| `url`      | string  |            |           | The URL to the configurable. e.g. 'http://www.example.com?name=value'              |
| `autoSave` | boolean | (optional) | true      | Whether to automatically save the web view response to options                     |

`open` is an optional callback used to perform any tasks before the webview is open, such as managing the options that will be passed to the web view.

````js
// Set a configurable with the open callback
Settings.config(
  { url: 'http://www.example.com' },
  function(e) {
    console.log('opening configurable');

    // Reset color to red before opening the webview
    Settings.option('color', 'red');
  },
  function(e) {
    console.log('closed configurable');
  }
);
````

`close` is a callback that is called when the webview is closed via `pebblejs://close`. Any arguments passed to `pebblejs://close` is parsed and passed as options to the handler. `Settings` will attempt to parse the response first as URI encoded json and second as form encoded data if the first fails.

````js
// Set a configurable with just the close callback
Settings.config(
  { url: 'http://www.example.com' },
  function(e) {
    console.log('closed configurable');

    // Show the parsed response
    console.log(JSON.stringify(e.options));

    // Show the raw response if parsing failed
    if (e.failed) {
      console.log(e.response);
    }
  }
);
````

To pass options from your configurable to `Settings.config` `close` in your webview, URI encode your options json as the hash to `pebblejs://close`. This will close your configurable, so you would perform this action in response to the user submitting their changes.

````js
var options = { color: 'white', border: true };
document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(options));
````

#### Settings.option

`Settings.option` is a data accessor built on localStorage that shares the options with the configurable web view.

#### Settings.option(field, value)

Saves `value` to `field`. It is recommended that `value` be either a primitive, or an object whose data is retained after going through `JSON.stringify` and `JSON.parse`.

````js
Settings.option('color', 'red');
````

If value is undefined or null, the field will be deleted.

````js
Settings.option('color', null);
````

#### Settings.option(field)

Returns the value of the option in `field`.

````js
var player = Settings.option('player');
console.log(player.id);
````

#### Settings.option(options)

Sets multiple options given an `options` object.

````js
Settings.option({
  color: 'blue',
  border: false,
});
````

#### Settings.option()

Returns all options. The options can be modified, but you must call `Settings.option` in a way that sets to save.

````js
var options = Settings.option();
console.log(JSON.stringify(options));
````

#### Settings.data

`Settings.data` is a data accessor similar to `Settings.option` except it saves your data in a separate space. This is provided as a way to save data or options that you don't want to pass to a configurable web view.

While localStorage is still accessible, it is recommended to use `Settings.data`.

#### Settings.data(field, value)

Saves `value` to `field`. It is recommended that `value` be either a primitive, or an object whose data is retained after going through `JSON.stringify` and `JSON.parse`.

````js
Settings.data('player', { id: 1, x: 10, y: 10 });
````

If value is undefined or null, the field will be deleted.

````js
Settings.data('player', null);
````

#### Settings.data(field)

Returns the value of the data in `field`.

````js
var player = Settings.data('player');
console.log(player.id);
````

#### Settings.data(data)

Sets multiple data given an `data` object.

````js
Settings.data({
  name: 'Pebble',
  player: { id: 1, x: 0, y: 0 },
});
````

#### Settings.data()

Returns all data. The data can be modified, but you must call `Settings.data` in a way that sets to save.

````js
var data = Settings.data();
console.log(JSON.stringify(data));
````

## UI

The UI framework contains all the classes needed to build the user interface of your Pebble applications and interact with the user.

### Accel

The `Accel` module allows you to get events from the accelerometer on Pebble.

You can use the accelerometer in two different ways:

 - To detect tap events. Those events are triggered when the user flicks his wrist or tap on the Pebble. They are the same events that are used to turn the Pebble back-light on. Tap events come with a property to tell you in which direction the Pebble was shook. Tap events are very battery efficient because they are generated directly by the accelerometer inside Pebble.
 - To continuously receive streaming data from the accelerometer. In this mode the Pebble will collect accelerometer samples at a specified frequency (from 10Hz to 100Hz), batch those events in an array and pass those to an event handler. Because the Pebble accelerometer needs to continuously transmit data to the processor and to the Bluetooth radio, this will drain the battery much faster.

````js
var Accel = require('ui/accel');
````

#### Accel.config(accelConfig)

This function configures the accelerometer `data` events to your liking. The `tap` event requires no configuration for use. Configuring the accelerometer is a very error prone process, so it is recommended to not configure the accelerometer and use `data` events with the default configuration without calling `Accel.config`.

`Accel.config` takes an `accelConfig` object with the following properties:

| Name        | Type    | Argument   | Default   | Description                                                                                                                                                                                                     |
| ----        | :----:  | :--------: | --------- | -------------                                                                                                                                                                                                   |
| `rate`      | number  | (optional) | 100       | The rate accelerometer data points are generated in hertz. Valid values are 10, 25, 50, and 100.                                                                                                                |
| `samples`   | number  | (optional) | 25        | The number of accelerometer data points to accumulate in a batch before calling the event handler. Valid values are 1 to 25 inclusive.                                                                          |
| `subscribe` | boolean | (optional) | automatic | Whether to subscribe to accelerometer data events. Accel.accelPeek cannot be used when subscribed. Pebble.js will automatically (un)subscribe for you depending on the amount of accelData handlers registered. |

The number of callbacks will depend on the configuration of the accelerometer. With the default rate of 100Hz and 25 samples, your callback will be called every 250ms with 25 samples each time.

**Important:** If you configure the accelerometer to send many `data` events, you will overload the bluetooth connection. We recommend that you send at most 5 events per second.

#### Accel.peek(callback)

Peeks at the current accelerometer value. The callback function will be called with the data point as an event.

````js
Accel.peek(function(e) {
  console.log('Current acceleration on axis are: X=' + e.accel.x + ' Y=' + e.accel.y + ' Z=' + e.accel.z);
});
````

#### Accel.on('tap', callback)

Subscribe to the `Accel` `tap` event. The callback function will be passed an event with the following fields:

 * `axis`: The axis the tap event occurred on: 'x', 'y', or 'z'.
 * `direction`: The direction of the tap along the axis: 1 or -1.

````js
Accel.on('tap', function(e) {
  console.log('Tap event on axis: ' + e.axis + ' and direction: ' + e.direction);
});
````

A [Window] may subscribe to the `Accel` `tap` event using the `accelTap` event type. The callback function will only be called when the window is visible.

````js
wind.on('accelTap', function(e) {
 console.log('Tapped the window');
});
````

#### Accel.on('data', callback)

Subscribe to the accel 'data' event. The callback function will be passed an event with the following fields:

 * `samples`: The number of accelerometer samples in this event.
 * `accel`: The first data point in the batch. This is provided for convenience.
 * `accels`: The accelerometer samples in an array.

One accelerometer data point is an object with the following properties:

| Property | Type    | Description                                                                                                                                                               |
| -------- | :----:  | ------------                                                                                                                                                              |
| `x`      | Number  | The acceleration across the x-axis (from left to right when facing your Pebble)                                                                                           |
| `y`      | Number  | The acceleration across the y-axis (from the bottom of the screen to the top of the screen)                                                                               |
| `z`      | Number  | The acceleration across the z-axis (going through your Pebble from the back side of your Pebble to the front side - and then through your head if Pebble is facing you ;) |
| `vibe`   | boolean | A boolean indicating whether Pebble was vibrating when this sample was measured.                                                                                          |
| `time`   | Number  | The amount of ticks in millisecond resolution when this point was measured.                                                                                               |

````js
Accel.on('data', function(e) {
  console.log('Just received ' + e.samples + ' from the accelerometer.');
});
````

A [Window] may also subscribe to the `Accel` `data` event using the `accelData` event type. The callback function will only be called when the window is visible.

````js
wind.on('accelData', function(e) {
 console.log('Accel data: ' + JSON.stringify(e.accels));
});
````

### Voice

The `Voice` module allows you to interact with Pebble's dictation API on supported platforms (Basalt and Chalk).

````js
var Voice = require('ui/voice');
````

#### Voice.dictate('start', [confirmDialog,] callback)

This function starts the dictation UI, and invokes the callback upon completion. The callback is passed an event with the following fields:

* `err`: A string describing the error, or `null` on success.
* `transcription`: The transcribed string.

An optional second parameter, `confirmDialog`, can be passed to the `Voice.dictate` method to control whether there should be a confirmation dialog displaying the transcription text after voice input. If `confirmDialog` is set to `false`, the confirmation dialog will be skipped. By default, there will be a confirmation dialog.

```js
// Start a diction session and skip confirmation
Voice.dictate('start', false, function(e) {
  if (e.err) {
    console.log('Error: ' + e.err);
    return;
  }

  main.subtitle('Success: ' + e.transcription);
});
```

**NOTE:** Only one dictation session can be active at any time. Trying to call `Voice.dicate('start', ...)` while another dictation session is in progress will result in the callback being called with an event having the error `"sessionAlreadyInProgress"`.

#### Voice.dictate('stop')

This function stops a dictation session that is currently in progress and prevents the session's callback from being invoked. If no session is in progress this method has no effect.

```js
Voice.dictate('stop');
```

### Window

`Window` is the basic building block in your Pebble.js application. All windows share some common properties and methods.

Pebble.js provides three types of Windows:

 * [Card]: Displays a title, a subtitle, a banner image and text on a screen. The position of the elements are fixed and cannot be changed.
 * [Menu]: Displays a menu on the Pebble screen. This is similar to the standard system menu in Pebble.
 * [Window]: The Window by itself is the most flexible. It allows you to add different [Element]s ([Circle], [Image], [Rect], [Text], [TimeText]) and to specify a position and size for each of them. You can also animate them.

| Name           | Type      | Default   | Description                                                                                     |
| ----           | :-------: | --------- | -------------                                                                                   |
| `clear`        | boolean   |           |                                                                                                 |
| `action`       | actionDef | None      | An action bar will be shown when configured with an `actionDef`.                                |
| `fullscreen`   | boolean   | false     | When true, the Pebble status bar will not be visible and the window will use the entire screen. |
| `scrollable`   | boolean   | false     | Whether the user can scroll this Window with the up and down button. When this is enabled, single and long click events on the up and down button will not be transmitted to your app. |

<a id="window-actiondef"></a>
#### Window actionDef
[Window actionDef]: #window-actiondef

A `Window` action bar can be displayed by setting its Window `action` property to an `actionDef`:

| Name              | Type      | Default   | Description                                                                                            |
| ----              | :-------: | --------- | -------------                                                                                          |
| `up`              | Image     | None      | An image to display in the action bar, next to the up button.                                          |
| `select`          | Image     | None      | An image to display in the action bar, next to the select button.                                      |
| `down`            | Image     | None      | An image to display in the action bar, next to the down button.                                        |
| `backgroundColor` | Image     | 'black'   | The background color of the action bar. You can set this to 'white' for windows with black backgrounds |

````js
var card = new UI.Card({
  action: {
    up: 'images/action_icon_plus.png',
    down: 'images/action_icon_minus.png'
  }
});
````

You will need to add images to your project according to the [Using Images] guide in order to display action bar icons.

#### Window.show()

This will push the window to the screen and display it. If user press the 'back' button, they will navigate to the previous screen.

#### Window.hide()

This hides the window.

If the window is currently displayed, this will take the user to the previously displayed window.

If the window is not currently displayed, this will remove it from the window stack. The user will not be able to get back to it with the back button.

````js
var splashScreen = new UI.Card({ banner: 'images/splash.png' });
splashScreen.show();

var mainScreen = new UI.Menu();

setTimeout(function() {
  // Display the mainScreen
  mainScreen.show();
  // Hide the splashScreen to avoid showing it when the user press Back.
  splashScreen.hide();
}, 400);
````

#### Window.on('click', button, handler)

Registers a handler to call when `button` is pressed.

````js
wind.on('click', 'up', function() {
  console.log('Up clicked!');
});
````

You can register a handler for the 'up', 'select', 'down', and 'back' buttons.

**Note:** You can also register button handlers for `longClick`.

#### Window.on('longClick', button, handler)

Just like `Window.on('click', button, handler)` but for 'longClick' events.

#### Window.on('load', handler(GSize))

Registers a handler to call when the window is loaded, identified, and size information is available. This is useful for positioning UI relative to screen boundaries.

````js
// Define the handler before showing.
wind.on('load', function(size) {
  console.log(size.w + 'x' + size.h + ' window loaded!');
});

// The load event will emit, and the handler will be called.
wind.show();
````

#### Window.on('show', handler)

Registers a handler to call when the window is shown. This is useful for knowing when a user returns to your window from another. This event is also emitted when programmatically showing the window. This does not include when a Pebble notification popup is exited, revealing your window.

````js
// Define the handler before showing.
wind.on('show', function() {
  console.log('Window is shown!');
});

// The show event will emit, and the handler will be called.
wind.show();
````

#### Window.on('hide', handler)

Registers a handler to call when the window is hidden. This is useful for knowing when a user exits out of your window or when your window is no longer visible because a different window is pushed on top. This event is also emitted when programmatically hiding the window. This does not include when a Pebble notification popup obstructs your window.

It is recommended to use this instead of overriding the back button when appropriate.

````js
wind.on('hide', function() {
  console.log('Window is hidden!');
});
````

#### Window.action(actionDef)

This is a special nested accessor to the `action` property which takes an `actionDef`. It can be used to set a new `actionDef`. See [Window actionDef].

````js
card.action({
  up: 'images/action_icon_up.png',
  down: 'images/action_icon_down.png'
});
````

#### Window.action(field, value)

You may also call `Window.action` with two arguments, `field` and `value`, to set specific fields of the window's `action` propery. `field` is a string refering to the [actionDef] property to change. `value` is the new property value to set.

````js
card.action('up', 'images/action_icon_plus.png');
````

#### Window.fullscreen(fullscreen)

Accessor to the `fullscreen` property. See [Window].

### Window (dynamic)

A [Window] instantiated directly is a dynamic window that can display a completely customizable user interface on the screen. Dynamic windows are initialized empty and will need [Element]s added to it. [Card] and [Menu] will not display elements added to them in this way.

````js
// Create a dynamic window
var wind = new UI.Window();

// Add a rect element
var rect = new UI.Rect({ size: new Vector2(20, 20) });
wind.add(rect);

wind.show();
````

#### Window.add(element)

Adds an element to to the [Window]. The element will be immediately visible.

#### Window.insert(index, element)

Inserts an element at a specific index in the list of Element.

#### Window.remove(element)

Removes an element from the [Window].

#### Window.index(element)

Returns the index of an element in the [Window] or -1 if the element is not in the window.

#### Window.each(callback)

Iterates over all the elements on the [Window].

````js
wind.each(function(element) {
  console.log('Element: ' + JSON.stringify(element));
});
````

### Card

A Card is a type of [Window] that allows you to display a title, a subtitle, an image and a body on the screen of Pebble.

Just like any window, you can initialize a Card by passing an object to the constructor or by calling accessors to change the properties.

````js
var card = new UI.Card({
  title: 'Hello People!'
});
card.body('This is the content of my card!');
````

The properties available on a [Card] are:

| Name         | Type      | Default   | Description                                                                                                                                                          |
| ----         | :-------: | --------- | -------------                                                                                                                                                        |
| `title`      | string    | ""        | Text to display in the title field at the top of the screen                                                                                                          |
| `subtitle`   | string    | ""        | Text to display below the title                                                                                                                                      |
| `body`       | string    | ""        | Text to display in the body field.                                                                                                                                   |
| `icon`       | Image     | null      | An image to display before the title text. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `subicon`    | Image     | null      | An image to display before the subtitle text. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `banner`     | Image     | null      | An image to display in the center of the screen. Refer to [Using Images] for instructions on how to include images in your app.                                                                     |
| `scrollable` | boolean   | false     | Whether the user can scroll this card with the up and down button. When this is enabled, single and long click events on the up and down button will not be transmitted to your app. |
| `style`      | string    | "small"   | Selects the font used to display the body. This can be 'small', 'large' or 'mono'                                                                                    |

The small and large styles correspond to the system notification styles. Mono sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.

Note that all fields will automatically span multiple lines if needed and that you can '\n' to insert line breaks.

### Menu

A menu is a type of [Window] that displays a standard Pebble menu on the screen of Pebble.

Just like any window, you can initialize a Menu by passing an object to the constructor or by calling accessors to change the properties.

The properties available on a [Menu] are:

| Name                        | Type    | Default | Description |
| ----                        |:-------:|---------|-------------|
| `sections`                  | Array   | `[]`    | A list of all the sections to display.            |
| `backgroundColor`           | Color   | `white` | The background color of a menu item.              |
| `textColor`                 | Color   | `black` | The text color of a menu item.                    |
| `highlightBackgroundColor`  | Color   | `black` | The background color of a selected menu item.     |
| `highlightTextColor`        | Color   | `white` | The text color of a selected menu item.           |

A menu contains one or more sections. Each section has a title and contains zero or more items. An item must have a title. It can also have a subtitle and an icon.

````js
var menu = new UI.Menu({
  backgroundColor: 'black',
  textColor: 'blue',
  highlightBackgroundColor: 'blue',
  highlightTextColor: 'black',
  sections: [{
    title: 'First section',
    items: [{
      title: 'First Item',
      subtitle: 'Some subtitle',
      icon: 'images/item_icon.png'
    }, {
      title: 'Second item'
    }]
  }]
});
````

#### Menu.section(sectionIndex, section)

Define the section to be displayed at `sectionIndex`. See [Menu] for the properties of a section.

````js
var section = {
  title: 'Another section',
  items: [{
    title: 'With one item'
  }]
};
menu.section(1, section);
````

When called with no `section`, returns the section at the given `sectionIndex`.

#### Menu.items(sectionIndex, items)

Define the items to display in a specific section. See [Menu] for the properties of an item.

````js
menu.items(0, [ { title: 'new item1' }, { title: 'new item2' } ]);
````

Whell called with no `items`, returns the items of the section at the given `sectionIndex`.

#### Menu.item(sectionIndex, itemIndex, item)

Define the item to display at index `itemIndex` in section `sectionIndex`. See [Menu] for the properties of an item.

````js
menu.item(0, 0, { title: 'A new item', subtitle: 'replacing the previous one' });
````

When called with no `item`, returns the item at the given `sectionIndex` and `itemIndex`.

#### Menu.selection(callback)

Get the currently selected item and section. The callback function will be passed an event with the following fields:

* `menu`: The menu object.
* `section`: The menu section object.
* `sectionIndex`: The section index of the section of the selected item.
* `item`: The menu item object.
* `itemIndex`: The item index of the selected item.

````js
menu.selection(function(e) {
  console.log('Currently selected item is #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
});
````

#### Menu.selection(sectionIndex, itemIndex)

Change the selected item and section.

````js
// Set the menu selection to the first section's third menu item
menu.selection(0, 2);
````

<a id="menu-on-select-callback"></a>
#### Menu.on('select', callback)
[Menu.on('select', callback)]: #menu-on-select-callback

Registers a callback called when an item in the menu is selected. The callback function will be passed an event with the following fields:

* `menu`: The menu object.
* `section`: The menu section object.
* `sectionIndex`: The section index of the section of the selected item.
* `item`: The menu item object.
* `itemIndex`: The item index of the selected item.

**Note:** You can also register a callback for 'longSelect' event, triggered when the user long clicks on an item.

````js
menu.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
});
````

#### Menu.on('longSelect', callback)

Similar to the select callback, except for long select presses. See [Menu.on('select', callback)].

### Element

There are four types of [Element] that can be instantiated at the moment: [Circle], [Image], [Rect] and [Text].

They all share some common properties:

| Name              | Type      | Default   | Description                                                                    |
| ------------      | :-------: | --------- | -------------                                                                  |
| `position`        | Vector2   |           | Position of this element in the window.                                        |
| `size`            | Vector2   |           | Size of this element in this window. Note that [Circle] uses `radius` instead. |
| `borderColor`     | string    | ''        | Color of the border of this element ('clear', 'black',or 'white').             |
| `backgroundColor` | string    | ''        | Background color of this element ('clear', 'black' or 'white').                |

All properties can be initialized by passing an object when creating the Element, and changed with accessors functions who have the name of the properties. Calling an accessor without a parameter will return the current value.

````js
var Vector2 = require('vector2');
var element = new Text({ position: new Vector2(0, 0), size: new Vector2(144, 168) });
element.borderColor('white');
console.log('This element background color is: ' + element.backgroundColor());
````

#### Element.index()

Returns the index of the element in its [Window] or -1 if the element is not part of a window.

#### Element.remove()

Removes the element from its [Window].

#### Element.animate(animateDef, [duration=400])

The `position` and `size` are currently the only Element properties that can be animated. An `animateDef` is object with any supported properties specified. See [Element] for a description of those properties. The default animation duration is 400 milliseconds.

````js
// Use the element's position and size to avoid allocating more vectors.
var pos = element.position();
var size = element.size();

// Use the *Self methods to also avoid allocating more vectors.
pos.addSelf(size);
size.addSelf(size);

// Schedule the animation with an animateDef
element.animate({ position: pos, size: size });
````

Each element has its own animation queue. Animations are queued when `Element.animate` is called multiple times at once with the same element. The animations will occur in order, and the first animation will occur immediately. Note that because each element has its own queue, calling `Element.animate` across different elements will result all elements animating the same time. To queue animations across multiple elements, see [Element.queue(callback(next))].

When an animation begins, its destination values are saved immediately to the [Element].

`Element.animate` is chainable.

#### Element.animate(field, value, [duration=400])

You can also animate a single property by specifying a field by its name.

````js
var pos = element.position();
pos.y += 20;
element.animate('position', pos, 1000);
````

<a id="element-queue-callback-next"></a>
#### Element.queue(callback(next))
[Element.queue(callback(next))]: #element-queue-callback-next

`Element.queue` can be used to perform tasks that are dependent upon an animation completing, such as preparing the element for a different animation. `Element.queue` can also be used to coordinate animations across different elements. It is recommended to use `Element.queue` instead of a timeout if the same element will be animated after the custom task.

The `callback` you pass to `Element.queue` will be called with a function `next` as the first parameter. When `next` is called, the next item in the animation queue will begin. Items includes callbacks added by `Element.queue` or animations added by `Element.animate` before an animation is complete. Calling `next` is equivalent to calling `Element.dequeue`.

````js
element
  .animate('position', new Vector2(0, 0)
  .queue(function(next) {
    this.backgroundColor('white');
    next();
  })
  .animate('position', new Vector2(0, 50));
````

`Element.queue` is chainable.

#### Element.dequeue()

`Element.dequeue` can be used to continue executing items in the animation queue. It is useful in cases where the `next` function passed in `Element.queue` callbacks is not available. See [Element.queue(callback(next))] for more information on the animation queue.

#### Element.position(position)

Accessor to the `position` property. See [Element].

#### Element.size(size)

Accessor to the `size` property. See [Element].

#### Element.borderColor(color)

Accessor to the `borderColor` property. See [Element].

#### Element.backgroundColor(color)

Accessor to the `backgroundColor` property. See [Element].

### Circle

An [Element] that displays a circle on the screen.

Default properties value:

 * `backgroundColor`: 'white'
 * `borderColor`: 'clear'

[Circle] also has the additional property `radius` which it uses for size rather than `size`. [Circle] is also different in that it positions its origin at the position, rather than anchoring by its top left. These differences are to keep the graphics operation characteristics that it is built upon.

````js
var wind = new UI.Window();

var circle = new UI.Circle({
  position: new Vector2(72, 84),
  radius: 25,
  backgroundColor: 'white',
});

wind.add(circle);
wind.show(circle);
````

#### Circle.radius(radius)

Accessor to the `radius` property. See [Circle]

### Rect

An [Element] that displays a rectangle on the screen.

The [Rect] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                        |
| ------------      | :-------: | --------- | -------------                                                      |
| `backgroundColor` | string    | "white"   | Background color of this element ('clear', 'black' or 'white').    |
| `borderColor`     | string    | "clear"   | Color of the border of this element ('clear', 'black',or 'white'). |

### Text

An [Element] that displays text on the screen.

The [Text] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------      | :-------: | --------- | -------------                                                                                                                                                                                                                                                                                                                                              |
| `text`            | string    | ""        | The text to display in this element.                                                                                                                                                                                                                                                                                                                       |
| `font`            | string    |           | The font to use for that text element. See [Using Fonts] for more information on the different fonts available and how to add your own fonts.                                                                                                                                                                                                              |
| `color`           |           | 'white'   | Color of the text ('white', 'black' or 'clear').                                                                                                                                                                                                                                                                                                           |
| `textOverflow`    | 'string'  |           | How to handle text overflow in this text element ('wrap', 'ellipsis' or 'fill').                                                                                                                                                                                                                                                                           |
| `textAlign`       | 'string'  |           | How to align text in this element ('left', 'center' or 'right').                                                                                                                                                                                                                                                                                           |
| `borderColor`     | string    | 'clear'   | Color of the border of this element ('clear', 'black',or 'white').                                                                                                                                                                                                                                                                                         |
| `backgroundColor` | string    | 'clear'   | Background color of this element ('clear', 'black' or 'white').                                                                                                                                                                                                                                                                                            |

### TimeText

A [Text] element that displays time formatted text on the screen.

#### Displaying time in a TimeText element

If you want to display the current time or date, use the `TimeText` element with a time formatting string in the `text` property. The time to redraw the time text element will be automatically calculated based on the format string. For example, a `TimeText` element with the format `'%M:%S'` will be redrawn every second because of the seconds format `%S`.

The available formatting options follows the C `strftime()` function:

| Specifier   | Replaced by                                                                                                                                                | Example                    |
| ----------- | -------------                                                                                                                                              | ---------                  |
| %a          | An abbreviation for the day of the week.                                                                                                                   | "Thu"                      |
| %A          | The full name for the day of the week.                                                                                                                     | "Thursday"                 |
| %b          | An abbreviation for the month name.                                                                                                                        | "Aug"                      |
| %B          | The full name of the month.                                                                                                                                | "August"                   |
| %c          | A string representing the complete date and time                                                                                                           | "Mon Apr 01 13:13:13 1992" |
| %d          | The day of the month, formatted with two digits.                                                                                                           | "23"                       |
| %H          | The hour (on a 24-hour clock), formatted with two digits.                                                                                                  | "14"                       |
| %I          | The hour (on a 12-hour clock), formatted with two digits.                                                                                                  | "02"                       |
| %j          | The count of days in the year, formatted with three digits (from `001` to `366`).                                                                          | "235"                      |
| %m          | The month number, formatted with two digits.                                                                                                               | "08"                       |
| %M          | The minute, formatted with two digits.                                                                                                                     | "55"                       |
| %p          | Either `AM` or `PM` as appropriate.                                                                                                                        | "AM"                       |
| %S          | The second, formatted with two digits.                                                                                                                     | "02"                       |
| %U          | The week number, formatted with two digits (from `00` to `53`; week number 1 is taken as beginning with the first Sunday in a year). See also `%W`.        | "33"                       |
| %w          | A single digit representing the day of the week: Sunday is day 0.                                                                                          | "4"                        |
| %W          | Another version of the week number: like `%U`, but counting week 1 as beginning with the first Monday in a year.                                           | "34"                       |
| %x          | A string representing the complete date.                                                                                                                   | "Mon Apr 01 1992"          |
| %X          | A string representing the full time of day (hours, minutes, and seconds).                                                                                  | "13:13:13"                 |
| %y          | The last two digits of the year.                                                                                                                           | "01"                       |
| %Y          | The full year, formatted with four digits to include the century.                                                                                          | "2001"                     |
| %Z          | Defined by ANSI C as eliciting the time zone if available; it is not available in this implementation (which accepts `%Z` but generates no output for it). |                            |
| %%          | A single character, `%`.                                                                                                                                   | "%"                        |

#### Text.text(text)

Sets the text property. See [Text].

#### Text.font(font)

Sets the font property. See [Text].

#### Text.color(color)

Sets the color property. See [Text].

#### Text.textOverflow(textOverflow)

Sets the textOverflow property. See [Text].

#### Text.textAlign(textAlign)

Sets the textAlign property. See [Text].

#### Text.updateTimeUnit(updateTimeUnits)

Sets the updateTimeUnits property. See [Text].

#### Text.borderColor(borderColor)

Sets the borderColor property. See [Text].

#### Text.backgroundColor(backgroundColor)

Sets the backgroundColor property. See [Text].

### Image

An [Element] that displays an image on the screen.

The [Image] element has the following properties. Just like any other [Element] you can initialize those properties when creating the object or use the accessors.

| Name              | Type      | Default   | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------      | :-------: | --------- | -------------                                                                                                                                                                                                                                                                                                                                              |
| `image`           | string    | ""        | The resource name or path to the image to display in this element. See [Using Images] for more information and how to add your own images. |
| `compositing`     | string    | "normal"  | The compositing operation used to display the image. See [Image.compositing(compop)] for a list of possible compositing operations.                |


#### Image.image(image)

Sets the image property. See [Image].

<a id="image-compositing"></a>
#### Image.compositing(compop)
[Image.compositing(compop)]: #image-compositing

Sets the compositing operation to be used when rendering. Specify the compositing operation as a string such as `"invert"`. The following is a list of compositing operations available.

| Compositing | Description                                                            |
| ----------- | :--------------------------------------------------------------------: |
| `"normal"`  | Display the image normally. This is the default.                       |
| `"invert"`  | Display the image with inverted colors.                                |
| `"or"`      | White pixels are shown, black pixels are clear.                        |
| `"and"`     | Black pixels are shown, white pixels are clear.                        |
| `"clear"`   | The image's white pixels are painted as black, and the rest are clear. |
| `"set"`     | The image's black pixels are painted as white, and the rest are clear. |

### Vibe

`Vibe` allows you to trigger vibration on the user wrist.

#### Vibe.vibrate(type)

````js
var Vibe = require('ui/vibe');

// Send a long vibration to the user wrist
Vibe.vibrate('long');
````

| Name | Type | Argument | Default | Description |
| ---- |:----:|:--------:|---------|-------------|
| `type` | string | optional | `short` | The duration of the vibration. `short`, `long` or `double`. |

### Light

`Light` allows you to control the Pebble's backlight.
````js
var Light = require('ui/light');

// Turn on the light
Light.on('long');
````

#### Light.on()
Turn on the light indefinitely.

#### Light.auto()
Restore the normal behaviour.

#### Light.trigger()
Trigger the backlight to turn on momentarily, just like if the user shook their wrist.

## Timeline

The Timeline module allows your app to handle a launch via a timeline action. This allows you to write a custom handler to manage launch events outside of the app menu. With the Timeline module, you can preform a specific set of actions based on the action which launched the app.

### Timeline

`Timeline` provides a single module of the same name `Timeline`.

````js
var Timeline = require('timeline');
````

<a id="timeline-launch"></a>
#### Timeline.launch(callback(event))
[Timeline.launch]: #timeline-launch

If you wish to change the behavior of your app depending on whether it was launched by a timeline event, and further configure the behavior based on the data associated with the timeline event, use `Timeline.launch` on startup. `Timeline.launch` will immediately call your launch callback asynchronously with a launch event detailing whether or not your app was launched by a timeline event.

````js
// Query whether we were launched by a timeline event
Timeline.launch(function(e) {
  if (e.action) {
    console.log('Woke up to timeline event: ' + e.launchCode + '!');
  } else {
    console.log('Regular launch not by a timeline event.');
  }
});
````

The `callback` will be called with a timeline launch event. The event has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `action`         | boolean | `true` if the app woke up by a timeline event, otherwise `false`. |
| `launchCode`     | number  | If woken by a timeline event, the code of the action. |

Note that this means you may have to move portions of your startup logic into the `Timeline.launch` callback or a function called by the callback. This can also add a very small delay to startup behavior because the underlying implementation must query the watch for the launch information.

## Wakeup

The Wakeup module allows you to schedule your app to wakeup at a specified time using Pebble's wakeup functionality. Whether the user is in a different watchface or app, your app while launch by the specified time. This allows you to write a custom alarm app, for example. If your app is already running, you may also subscribe to receive the wakeup event, which can be useful for more longer lived timers. With the Wakeup module, you can save data to be read on launch and configure your app to behave differently based on launch data. The Wakeup module, like the Settings module, is backed by localStorage.

### Wakeup

`Wakeup` provides a single module of the same name `Wakeup`.

````js
var Wakeup = require('wakeup');
````

<a id="wakeup-schedule"></a>
#### Wakeup.schedule(options, callback(event))
[Wakeup.schedule]: #wakeup-schedule

Schedules a wakeup event that will wake up the app at the specified time. `callback` will be immediately called asynchronously with whether the wakeup event was successfully set or not. Wakeup events cannot be scheduled within one minute of each other regardless of what app scheduled them. Each app may only schedule up to 8 wakeup events.

See [Clock.weekday] for setting wakeup events at particular times of a weekday.

````js
Wakeup.schedule(
  {
    // Set the wakeup event for one minute from now
    time: Date.now() / 1000 + 60,
    // Pass data for the app on launch
    data: { hello: 'world' }
  },
  function(e) {
    if (e.failed) {
      // Log the error reason
      console.log('Wakeup set failed: ' + e.error);
    } else {
      console.log('Wakeup set! Event ID: ' + e.id);
    }
  }
);
````

The supported `Wakeup.schedule` options are:

| Name             | Type    | Argument   | Default   | Description   |
| ----             | :----:  | :--------: | --------- | ------------- |
| `time`           | number  | required   |           | The time for the app to launch in seconds since the epoch as a number. Time can be specified as a Date object, but is not recommended due to timezone confusion. If using a Date object, no timezone adjustments are necessary if the phone's timezone is properly set. |
| `data`           | *       | optional   |           | The data to be saved for the app to read on launch. This is optional. See [Wakeup.launch]. Note that `data` is backed by localStorage and is thus saved on the phone. Data must be JSON serializable as it uses `JSON.stringify` to save the data. |
| `cookie`         | number  | optional   | 0         | A 32-bit unsigned integer to be saved for the app to read on launch. This is an optional alternative to `data` can also be used in combination. The integer is saved on the watch rather than the phone. |
| `notifyIfMissed` | boolean | optional   | false     | The user can miss a wakeup event if their watch is powered off. Specify `true` if you would like Pebble OS to notify them if they missed the event. |

Scheduling a wakeup event can result in errors. By providing a `callback`, you can inspect whether or not you have successfully set the wakeup event. The `callback` will be called with a wakeup set result event which has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | If successfully set, the wakeup event id. |
| `error`          | string  | On set failure, the type of error. |
| `failed`         | boolean | `true` if the event could not be set, otherwise `false`. |
| `data`           | number  | The custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | The custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |

Finally, there are multiple reasons why setting a wakeup event can fail. When a wakeup event fails to be set, `error` can be one of the following strings:

| Error               | Description   |
| -----               | ------------- |
| `'range'`           | Another wakeup event is already scheduled close to the requested time. |
| `'invalidArgument'` | The wakeup event was requested to be set in the past. |
| `'outOfResources'`  | The app already has the maximum of 8 wakeup events scheduled. |
| `'internal'`        | There was a Pebble OS error in scheduling the event. |

<a id="wakeup-launch"></a>
#### Wakeup.launch(callback(event))
[Wakeup.launch]: #wakeup-launch

If you wish to change the behavior of your app depending on whether it was launched by a wakeup event, and further configure the behavior based on the data associated with the wakeup event, use `Wakeup.launch` on startup. `Wakeup.launch` will immediately call your launch callback asynchronously with a launch event detailing whether or not your app was launched by a wakeup event.

If you require knowing when a wakeup event occurs while your app is already running, refer to [Wakeup.on('wakeup')] to register a wakeup callback that will be called for both launch wakeup events and wakeup events while already running.

````js
// Query whether we were launched by a wakeup event
Wakeup.launch(function(e) {
  if (e.wakeup) {
    console.log('Woke up to ' + e.id + '! data: ' + JSON.stringify(e.data));
  } else {
    console.log('Regular launch not by a wakeup event.');
  }
});
````

The `callback` will be called with a wakeup launch event. The event has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | If woken by a wakeup event, the wakeup event id. |
| `wakeup`         | boolean | `true` if the launch event is a wakeup event, otherwise `false`. |
| `launch`         | boolean | `true` if the launch was caused by this wakeup event, otherwise `false`. |
| `data`           | number  | If woken by a wakeup event, the custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | If woken by a wakeup event, the custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |

**Note:** You may have to move portions of your startup logic into the `Wakeup.launch` callback or a function called by the callback. This can also add a very small delay to startup behavior because the underlying implementation must query the watch for the launch information.

<a id="wakeup-on-wakeup"></a>
#### Wakeup.on('wakeup', handler)
[Wakeup.on('wakeup')]: #wakeup-on-wakeup

Registers a handler to call when a wakeup event occurs. This includes launch wakeup events and wakeup events while already running. See [Wakeup.launch] for the properties of the wakeup event object to be passed to the handler.

````js
// Single wakeup event handler example:
Wakeup.on('wakeup', function(e) {
  console.log('Wakeup event! ' + JSON.stringify(e));
});
````

If you want your wakeup handler to only receive wakeup events while already running, you can either test against the `.launch` boolean property, or use a wakeup launch handler to block the event from being sent to additional handlers. Wakeup events are sent to launch wakeup handlers first, then to general wakeup handlers next.

````js
// Single already-running example:
Wakeup.on('wakeup', function(e) {
  if (!e.launch) {
    console.log('Already-running wakeup: ' + JSON.stringify(e));
  }
});
````

**Note:** Returning false will also prevent further handlers of the same type from receiving the event.  Within each type of handlers, they are passed in registration order. The passing process ends if any handler returns false.

````js
// Launch + Already-running example:
// Launch wakeup handler
Wakeup.launch(function(e) {
  if (e.wakeup) {
    console.log('Launch wakeup: ' + JSON.stringify(e));
  }
  // Do not pass the event to additional handlers
  return false;
});

// Since the launch wakeup handler returns false,
// this becomes an already-running wakeup handler
Wakeup.on('wakeup', function(e) {
  console.log('Wakeup: ' + JSON.stringify(e));
});
````

<a id="wakeup-get"></a>
#### Wakeup.get(id)
[Wakeup.get]: #wakeup-get

Get the wakeup state information by the wakeup id. A wakeup state has the following properties:

| Name             | Type    | Description   |
| ----             | :----:  | ------------- |
| `id`             | number  | The wakeup event id. |
| `time`           | number  | The time for the app to launch. This depends on the data type pass to [Wakeup.schedule]. If a Date object was passed, this can be a string because of localStorage. |
| `data`           | number  | The custom `data` that was associated with the wakeup event. |
| `cookie`         | number  | The custom 32-bit unsigned integer `cookie` that was associated with the wakeup event. |
| `notifyIfMissed` | boolean | Whether it was requested for Pebble OS to notify the user if they missed the wakeup event. |

````js
var wakeup = Wakeup.get(wakeupId);
console.log('Wakeup info: ' + JSON.stringify(wakeup));
````

<a id="wakeup-each"></a>
#### Wakeup.each(callback(wakeup))
[Wakeup.each]: #wakeup-each

Loops through all scheduled wakeup events that have not yet triggered by calling the `callback` for each wakeup event. See [Wakeup.get] for the properties of the `wakeup` object to be passed to the callback.

````js
var numWakeups = 0;

// Query all wakeups
Wakeup.each(function(e) {
  console.log('Wakeup ' + e.id + ': ' + JSON.stringify(e));
  ++numWakeups;
});

main.body('Number of wakeups: ' + numWakeups);
````

#### Wakeup.cancel(id)

Cancels a particular wakeup event by id. The wakeup event id is obtained by the set result callback when setting a wakeup event. See [Wakeup.schedule].

#### Wakeup.cancel('all')

Cancels all wakeup events scheduled by your app. You can check what wakeup events are set before cancelling them all. See [Wakeup.each].

## Libraries

Pebble.js includes several libraries to help you write applications.

### ajax

This module gives you a very simple and easy way to make HTTP requests.

````js
var ajax = require('ajax');

ajax(
  {
    url: 'http://api.theysaidso.com/qod.json',
    type: 'json'
  },
  function(data, status, request) {
    console.log('Quote of the day is: ' + data.contents.quote);
  },
  function(error, status, request) {
    console.log('The ajax request failed: ' + error);
  }
);
````

#### ajax(options, success, failure)

The supported options are:

| Name      | Type    | Argument   | Default   | Description                                                                                                                                                                   |
| ----      | :----:  | :--------: | --------- | -------------                                                                                                                                                                 |
| `url`     | string  |            |           | The URL to make the ajax request to. e.g. 'http://www.example.com?name=value'                                                                                                 |
| `method`  | string  | (optional) | get       | The HTTP method to use: 'get', 'post', 'put', 'delete', 'options', or any other standard method supported by the running environment.                                         |
| `type`    | string  | (optional) |           | The content and response format. By default, the content format is 'form' and response format is separately 'text'. Specifying 'json' will have ajax send `data` as json as well as parse the response as json. Specifying 'text' allows you to send custom formatted content and parse the raw response text. If you wish to send form encoded data and parse json, leave `type` undefined and use `JSON.decode` to parse the response data.
| `data`    | object  | (optional) |           | The request body, mainly to be used in combination with 'post' or 'put'. e.g. `{ username: 'guest' }`
| `headers` | object  | (optional) |           | Custom HTTP headers. Specify additional headers. e.g. `{ 'x-extra': 'Extra Header' }`
| `async`   | boolean | (optional) | true      | Whether the request will be asynchronous. Specify `false` for a blocking, synchronous request.
| `cache`   | boolean | (optional) | true      | Whether the result may be cached. Specify `false` to use the internal cache buster which appends the URL with the query parameter `_set` to the current time in milliseconds. |

The `success` callback will be called if the HTTP request is successful (when the status code is inside [200, 300) or 304). The parameters are the data received from the server, the status code, and the request object. If the option `type: 'json'` was set, the response will automatically be converted to an object, otherwise `data` is a string.

The `failure` callback is called when an error occurred. The parameters are the same as `success`.

### Vector2

A 2 dimensional vector. The constructor takes two parameters for the x and y values.

````js
var Vector2 = require('vector2');

var vec = new Vector2(144, 168);
````

For more information, see [Vector2 in the three.js reference documentation][three.js Vector2].


[API Reference]: #api-reference
[Using Images]: #using-images
[Using Fonts]: #using-fonts

[Clock]: #clock
[Window]: #window
[Card]: #card
[Menu]: #menu
[Element]: #element
[Circle]: #circle
[Image]: #image
[Rect]: #rect
[Text]: #text
[TimeText]: #timetext
[three.js Vector2]: http://threejs.org/docs/#Reference/Math/Vector2

## Examples

Coming Soon!

## Acknowledgements

Pebble.js started as [Simply.JS](http://simplyjs.io), a project by [Meiguro](http://github.com/meiguro). It is now part of the Pebble SDK and supported by Pebble. Contact [devsupport@getpebble.com](mailto:devsupport@getpebble.com) with any questions!

This documentation uses [Flatdoc](http://ricostacruz.com/flatdoc/#flatdoc).
