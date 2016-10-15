/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

var TRIG_MAX_ANGLE = 0x10000;

var main = new UI.Card({
  title: 'Pebble.js',
  icon: 'images/menu_icon.png',
  subtitle: 'Hello World!',
  body: 'Press any button.',
  subtitleColor: 'indigo', // Named colors
  bodyColor: '#9a0036' // Hex colors
});

main.show();

main.on('click', 'up', function(e) {
  var menu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Pebble.js',
        icon: 'images/menu_icon.png',
        subtitle: 'Can do Menus'
      }, {
        title: 'Second Item',
        subtitle: 'Subtitle Text'
      }, {
        title: 'Third Item',
      }, {
        title: 'Fourth Item',
      }]
    }]
  });
  menu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
  });
  menu.show();
});

main.on('click', 'select', function(e) {
  var wind = new UI.Window({
    backgroundColor: 'black'
  });
  var radial = new UI.Radial({
    size: new Vector2(140, 140),
    angle: 0,
    angle2: 300,
    radius: 10,
    backgroundColor: 'cyan',
    borderColor: 'celeste',
    borderWidth: 1,
  });
  var windSize = wind.size();
  // Center the radial in the window
  var radialPos = radial.position()
      .addSelf(windSize)
      .subSelf(radial.size())
      .multiplyScalar(0.5);
  radial.position(radialPos);
  var textfield = new UI.Text({
    size: new Vector2(140, 60),
    font: 'gothic-18',
    text: 'Dynamic\nWindow',
    textAlign: 'center'
  });
  // Center the textfield in the window
  var textfieldPos = textfield.position()
    .addSelf(windSize)
    .subSelf(textfield.size())
    .multiplyScalar(0.5)
    .addSelf({ x: 0, y: 10 });
  textfield.position(textfieldPos);
  wind.add(radial);
  wind.add(textfield);
  // Add clock ticks inside radial using path fields
  var centerPos = wind.size().multiplyScalar(0.5);
  var outerSize = radial.size().y / 2 - radial.radius() - 15;
  for (var i = 0; i < 12; i++) {
    wind.add(new UI.Path({
      p0: { x: -2, y: outerSize - 7 },
      p1: { x: -2, y: outerSize + 7 },
      p2: { x:  2, y: outerSize + 7 },
      p3: { x:  2, y: outerSize - 7 },
      offset: centerPos,
      rotation: Math.floor(TRIG_MAX_ANGLE * i / 12)
    }));
  }
  wind.show();
});

main.on('click', 'down', function(e) {
  var card = new UI.Card();
  card.title('A Card');
  card.subtitle('Is a Window');
  card.body('The simplest window type in Pebble.js.');
  card.show();
});
