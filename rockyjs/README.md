Pebble.js + Rocky.js
====================

Pebble.js development in a browser!

Given that Rocky.js provides the Pebble API implemented in javascript, we can now combine Pebble.js and Rocky.js and develop in the web browser with all the javascript development tools.

## Work in Progress

This is a currently a Proof of Concept with minimal implementataion for the following:
* `window`
* `click`
* `rect`
* `text` - inlcuding fonts
* `texttime`

It works by replacing `simply-pebble.js` with `simply-rocky.js` at build time. There is some leakage to other classes, for example `Simply.markDirty()` has been added and called from `Window` to optimize the screen redraws.

`simply-rocky.js` is a copy and paste of `simply-pebble.js`. In time all the `simply-pebble.js` hangover code will be removed and replace with the Rocky implementation.

There is limited support.

## Getting Started

To support the Pebble.js build system we use Gulp and Browserify to build the javascript with Rocky.js
 
* [Install Gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)

* Run Browserify `gulp browserify` - this should finish without issues. Fix any issues you find

* Run `gulp watch` - this will launch a browser and run the app. It will automatically reload the app when the source files change
