var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var KEY = require('key');
var Statics = require('statics')

Statics.welcomeWindow.show()

// Request location
navigator.geolocation.getCurrentPosition(locationSuccess, locationError);

function locationError(err) {
  console.log('location error (' + err.code + '): ' + err.message);
}

// When location request succeeds
function locationSuccess(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  // console.log("Seattle test");
  // latitude = 47.616215;
  // longitude = -122.332792;
  // console.log("new york test");
  // latitude = 40.748433;
  // longitude = -73.985656;
  // console.log("tampa test");
  // latitude = 28.0029;
  // longitude = -82.4666;
  // console.log("boston test");
  // latitude = 42.3601;
  // longitude = -71.0589;
  // console.log("boston test 2");
  // latitude = 42.348714;
  // longitude = -71.083212;
  var currentGeoRegion = geoRegion(latitude, longitude);
  // console.log("location is " + latitude + " " + longitude + " " + currentGeoRegion);
  var url = urlStopsForLocations(latitude, longitude);
  var currentStopIds = showStopListMenu(latitude, longitude, false, false);
  console.log("currentStopIds, " + currentStopIds);
  // Check if any favorite locations is nearby
  var favoriteData = Settings.data()["favorite_list"] || [];
  var favoritePageToShow = false;
  for (var i = 0; i < favoriteData.length; i++) {
    console.log(favoriteData[i].stopId);
    if (arrayContains(currentStopIds, favoriteData[i].stopId)) {
      console.log("favorite stop id is " + favoriteData[i].stopId);
      showBusRoutesMenu(favoriteData[i].stopId, favoriteData[i].name, favoriteData[i].direction, latitude, longitude);
      favoritePageToShow = true;
    }
  }
  if (!favoritePageToShow) {
    showStopListMenu(latitude, longitude);
  }
}

// Prepare the accelerometer
Accel.init();

var showStopListMenu = function(latitude,longitude,asyncMode,showMode) {
  var url = urlStopsForLocations(latitude, longitude);
  var region = geoRegion(latitude, longitude);
  var stopIdList = [];
  if (typeof asyncMode === 'undefined') { asyncMode = true ; }
  if (typeof showMode === 'undefined') { showMode = true ; }
  ajax(
    {
      url: url,
      type:'json',
      async: asyncMode
    },
    function(data) {
      // Create an array of Menu items
      var menuItems = parseFeed(data,region);
      var favoriteData = Settings.data()["favorite_list"] || [];
      if (favoriteData.length > 0) {
        menuItems.unshift({
          title: "Favorite stops"
        })
      }
      stopIdList = busStopIds(data,region);
      console.log("Bus stop list " + url);
      if (showMode) {
        // Construct Menu to show to user
        var resultsMenu = new UI.Menu({
          backgroundColor: 'white',
          textColor: 'black',
          highlightBackgroundColor: 'bulgarianRose',
          highlightTextColor: 'white',
          sections: [{
            title: 'Nearby stops',
            items: menuItems
          }]
        });

        // Show the Menu, hide the splash
        resultsMenu.show();
        Statics.welcomeWindow.hide();

        // Add an action for SELECT
        resultsMenu.on('select', function(e) {
          if (e.item.title === "Settings") {
            appSettings();
          } else if (e.item.title === "Favorite stops") {
            showFavoriteStops(latitude,longitude);
          } else {
            var busStopNameAndId = e.item.title.split(",")
            var busStopName = busStopNameAndId[busStopNameAndId.length-2];
            var busStopId = busStopNameAndId[busStopNameAndId.length-1]
            var busStopDirection = e.item.subtitle.split(",")[0];
            showBusRoutesMenu(busStopId, busStopName, busStopDirection, latitude, longitude);
          }
        }); // end resultsMenu.on

        // Register for 'tap' events
        resultsMenu.on('accelTap', function(e) {
          ajax(
            {
              url: url,
              type:'json'
            },
            function(data) {
              // Update the Menu's first section
              menuItems = parseFeed(data,region);
              if (favoriteData.length > 0) {
                menuItems.unshift({
                  title: "Favorite stops"
                })
              }
              resultsMenu.items(0, menuItems);
              console.log(JSON.stringify(parseFeed(data,region)));
            },
            function(error) {
              console.log('Download failed: ' + error);
            }
          );
        });
      }
    }
  );
  return stopIdList;
};

var showBusRoutesMenu = function(busStopId, busStopName, busStopDirection, latitude, longitude, asyncMode) {
  // show bus routes for a given stop id
  if (typeof asyncMode === 'undefined') { asyncMode = true; }
  var busStopURL = urlRoutesForStops(latitude, longitude, busStopId);
  var region = geoRegion(latitude, longitude);
  console.log(busStopURL);
  ajax(
    {
      url: busStopURL,
      type: 'json',
      async: asyncMode
    },
    function(busData) {
      var detailRoutes = new UI.Menu({
        backgroundColor: 'white',
        textColor: 'black',
        highlightBackgroundColor: 'bulgarianRose',
        highlightTextColor: 'white',
        sections: [{
          title: busStopName + ' ' + busStopDirection,
          items: realTimeBusRoutes(busData, region).busTimeItems
        }],
      });

      detailRoutes.show();
      Statics.welcomeWindow.hide();

      // Add an action for select save as favorite
      detailRoutes.on('select', function(e) {
        if (e.item.title === "Save as favorite") {
          var data = Settings.data();
          //Settings.data("favorite_list",null);
          var stopList = data["favorite_list"] || [];
          var stopIdList = [];
          for(var i = 0; i < stopList.length; i++) {
            stopIdList.push(stopList[i].stopId);
          }
          console.log(stopIdList);
          if (arrayContains(stopIdList,busStopId)) {
            favoriteConfirmPage(busStopId,busStopName,busStopDirection);
          } else {
            stopList.push({
              stopId: busStopId,
              name: busStopName,
              direction: busStopDirection,
              region: region
            });
            favoriteConfirmPage(busStopId,busStopName,busStopDirection);
          }
          Settings.data("favorite_list", stopList);
          console.log(JSON.stringify(Settings.data()));
        } else if (e.item.title === "Nearby stop list") {
          showStopListMenu(latitude,longitude);
        } else if (e.item.title === "Settings") {
          appSettings();
        } else if (e.item.title === "No buses") {
        } else {
          showBusDetailPage(e,region);
          // Pause development for bus alert system
          // showBusTrackingPage(latitude, longitude,realTimeBusRoutes(busData).busDetails[e.itemIndex]);
        }
      });

      // Register for 'tap' events
      detailRoutes.on('accelTap', function(e) {
        ajax(
          {
            url: busStopURL,
            type:'json'
          },
          function(updatedBusData) {
            // Update the bus time list
            detailRoutes.items(0, realTimeBusRoutes(updatedBusData, region)["busTimeItems"]);
            console.log(JSON.stringify(realTimeBusRoutes(updatedBusData, region)["busTimeItems"]));
            console.log(JSON.stringify(realTimeBusRoutes(updatedBusData, region)["busDetails"]));
          },
          function(busDataError) {
            console.log('Download failed: ' + busDataError);
          }
        );
      });
    },
    function(error) {
      showNoBusPage();
      console.log('Download failed: ' + JSON.stringify(error));
    }
  );
}

var showBusDetailPage = function(e, region) {
  var detail = e.item.subtitle.split(",");
  var busDetailPage;
  var stopNameDescription; // string for describing at which station in the detail card
  if (arrayContains(["pugetsound", "tampa", "newyork"], region)) {
    stopNameDescription = ', at ' + e.section.title + ' bound.';
  } else if (arrayContains(["boston"], region)) {
    stopNameDescription = ', at ' + e.section.title + '.';
  }
  if (detail[1]) {
    busDetailPage = new UI.Card({
      title: e.item.title,
      body:  detail[0] + ', to' + detail[1] + stopNameDescription
    });
  } else {
    busDetailPage = new UI.Card({
      title: e.item.title.split(" away")[0],
      body:  'to ' + detail[0] + stopNameDescription
    });
  }
  busDetailPage.show();
}

var showBusTrackingPage = function(latitude, longitude, busDetail) {
  var timing = [];
  for (var i = 0; i < 8; i ++) {
    k = i + 1;
    timing.push({
      title: k + " min alert",
      subtitle: "before bus arrives"
    });
  }

  var busDetailPage = new UI.Menu({
    sections: [ {
      title: busDetail.routeShortName + ', ' + busDetail.tripHeadsign,
      items: timing
    } ],
  });

  busDetailPage.show();

  busDetailPage.on('select', function(e) {
    notifyBusApproaching(latitude, longitude, busDetail, e.item.title);
  });
}

var notifyBusApproaching = function(latitude, longitude, busDetail,timer) {
  timer = parseInt(timer) // mins
  console.log(urlRoutesForBus(latitude, longitude, busDetail));
  var interval = window.setInterval(function() {
    ajax(
    {
      url: urlRoutesForBus(latitude, longitude, busDetail),
      type: 'json'
    },
    function(busData) {
      var nowTime = parseInt(Date.now());
      console.log("nowTime " + nowTime);
      console.log("timer " + timer);
      var predictedArrivalTime = parseInt(busData.data.entry.predictedArrivalTime);
      var scheduledArrivalTime = parseInt(busData.data.entry.scheduledArrivalTime);
      if (predictedArrivalTime === 0 || !predictedArrivalTime ) {
        predictedArrivalTime = scheduledArrivalTime;
      }
      console.log("predictedArrivalTime " + predictedArrivalTime);
      if ( (predictedArrivalTime - nowTime) < timer * 60 * 1000 ) {
        console.log("Alert!");
        Vibe.vibrate('long');
        showBusAlertPage(busDetail, timer);
        clearInterval(interval);
      }
    }
    )
  }, 10000);
}

var showBusAlertPage = function(busDetail, timer) {
  var alertPage = new UI.Card({
    title: busDetail.routeShortName + " arriving!",
    body: busDetail.routeShortName + " towords " + busDetail.tripHeadsign + " is arriving in " + timer + ' min',
  });
  alertPage.show();
};

var favoriteConfirmPage = function(busStopId, busStopName, busStopDirection) {
  var favoriteItems = [];
  favoriteItems.push({
    title: busStopName,
    subtitle: busStopDirection + ", Stop_ID " + busStopId
  });
  favoriteItems.push({
    title: "Favorite stops",
    subtitle: "Already saved favorite stops."
  });
  var favoriteConfirm = new UI.Menu({
    sections: [{ title: "Saved", items: favoriteItems }],
  });
  favoriteConfirm.show();
  favoriteConfirm.on('select', function(e) {
    if (e.item.title === "Favorite stops") {
      showFavoriteStops();
      favoriteConfirm.hide();
    }
  });
};

var appSettings = function() {
  var settingItems = [];
  settingItems.push({
    title: "Favorite stops",
    subtitle: "A full list of saved favorite stops"
  });
  settingItems.push({
    title: "Search radius",
    subtitle: "Set search radius"
  });
  settingItems.push({
    title: "About"
  });
  settingItems.push({
    title: "Version"
  });
  var settingPage = new UI.Menu({
    sections: [{ title: "Settings", items: settingItems }],
  });
  settingPage.show();
  settingPage.on('select', function(e) {
    if (e.item.title === "Favorite stops") {
      showFavoriteStops();
    }
    if (e.item.title === "Search radius") {
      showRadiusSettings();
    }
    if (e.item.title === "About") {
      Statics.aboutPage.show();
    }
    if (e.item.title === "Version") {
      Statics.showVersionPage();
    }
  });
};

var showFavoriteStops = function(latitude, longitude) {
  var favoriteStopList = [];
  var favoriteStopListData = Settings.data()["favorite_list"];
  for (var i = 0; i < favoriteStopListData.length; i ++) {
    favoriteStopList.push({
      title: favoriteStopListData[i].name,
      subtitle: favoriteStopListData[i].direction + ", Stop_ID " + favoriteStopListData[i].stopId
    });
  }
  var favoriteStopsPage = new UI.Menu({
    sections: [{ title: "Favorite stops", items: favoriteStopList }],
  });
  favoriteStopsPage.show();
  favoriteStopsPage.on('select', function(e) {
    if (typeof latitude === 'undefined') {
      deleteFavoriteStop(favoriteStopListData[e.itemIndex].stopId);
    } else {
      showBusRoutesMenu(favoriteStopListData[e.itemIndex].stopId, favoriteStopListData[e.itemIndex].name, favoriteStopListData[e.itemIndex].direction, latitude, longitude);
    }
    // favoriteStopsPage.hide();
  });
};

var showRadiusSettings = function() {
  var radiusList = [
    { title: "160" },
    { title: "260" },
    { title: "360" },
    { title: "460" },
    { title: "560" },
    { title: "760" },
    { title: "860" },
    { title: "960" },
    { title: "1060" },
  ];
  var radiusSettings = new UI.Menu({
    sections: [{ title: "Search radius in meters", items: radiusList }],
  });
  radiusSettings.show();
  radiusSettings.on('select', function(e) {
    Settings.data("searchRadius", e.item.title);
    console.log(JSON.stringify(Settings.data()));
    var searchRadiusConfirm = new UI.Card({
      title: "Confirmed",
      body: "Search radius is now " + Settings.data()["searchRadius"] + " meters"
    });
    searchRadiusConfirm.show();
    radiusSettings.hide();
  });
};

var showVersionPage = function() {
  var versionInfos = [{
    title: "1.7",
    subtitle: "Access to favorite stop real time bus info."
  }, {
    title: "1.6",
    subtitle: "Time prediction instead of distance for New York where data is available. Add version page. Fix bug in Boston when API provides no info."
  }, {
    title: "1.5",
    subtitle: "Add support for Boston. Display one digit precision time for predictions under 5 minutes. Add color for Basalt application."
  }, {
    title: "1.4",
    subtitle: "Now works in New York area. Add more radius options for 760-1060."
  }, {
    title: "1.3",
    subtitle: "Add bus detail page where you click each bus line."
  }, {
    title: "1.2",
    subtitle: "Minor updates to not show buses that have left more than 1 min ago."
  }, {
    title: "1.1",
    subtitle: "Added support for Tampa area, more Settings radius options, and also added settings entry in the bus real time info page."
  }, {
    title: "1.0",
    subtitle: "Check nearby bus stops, real bus timing info from each stop, able to favorite any stop, favorited stop bus real time info will be brought up at the first page if user is near that stop."
  }];
  var versionPage = new UI.Menu({
    sections: [{ title: "Version Info", items: versionInfos }],
  });
  versionPage.show();
  versionPage.on('select', function(e) {
    showMenuDetailPage(e);
  });
}

var showMenuDetailPage = function(e) {
  detailPage = new UI.Card({
    title: e.item.title,
    body:  e.item.subtitle,
    scrollable: true,
    style: 'small'
  });
  detailPage.show();
}

var showNoBusPage = function() {
  var noBusPage = new UI.Card({
    title: "No Bus",
    body: "No bus real time info is available for this stop."
  });
  noBusPage.show();
}

var deleteFavoriteStop = function(busStopId) {
  var deletePage = new UI.Menu({
    sections: [{
      title: "Delete Stop",
      items: [
        {
          title: "Delete",
          subtitle: "Remove this stop from favorite stops"
        }
      ]
    }],
  });
  deletePage.show();
  deletePage.on('select', function(e) {
    if(e.item.title === "Delete") {
      var favoriteStopListData = Settings.data()["favorite_list"];
      for (var i = 0; i < favoriteStopListData.length; i ++) {
        if (favoriteStopListData[i].stopId === busStopId) {
          favoriteStopListData.splice(i,1);
          Settings.data("favorite_list", favoriteStopListData);
          deletePage.hide();
          showFavoriteStops();
          break;
        }
      }
    }
  });
};

var realTimeBusRoutes = function(busData, region) {
  // return JSON contains { "busTimeItems": list of bus routes short name and real arrival time, "busDetails": list of bus details }
  var busTimeItems = [];
  var busDetails = [];
  console.log("reach realTimeBusRoutes " + region);
  var nowTime = parseInt(Date.now());
  if (arrayContains(["pugetsound", "tampa"], region)) {
    var arrivalsAndDepartures = busData.data.entry.arrivalsAndDepartures;
    for (var i = 0; i < arrivalsAndDepartures.length; i++)  {
      // Add to busTimeItems array
      var routeShortName = arrivalsAndDepartures[i].routeShortName;
      var predictedArrivalTime = parseInt(arrivalsAndDepartures[i].predictedArrivalTime);
      var scheduledArrivalTime = parseInt(arrivalsAndDepartures[i].scheduledArrivalTime);
      if(predictedArrivalTime === 0 || !predictedArrivalTime ) {
        predictedArrivalTime = scheduledArrivalTime;
      }
      var predictedArrivalMinutes = parseTimeDisplay((predictedArrivalTime - nowTime)/1000);
      var predictedArrivalInfo = '';
      if (predictedArrivalMinutes > - 2) {
        if (predictedArrivalMinutes > 0) {
          predictedArrivalInfo = 'in ' + predictedArrivalMinutes + ' min';
        } else if (predictedArrivalMinutes === 0) {
          predictedArrivalInfo = 'Now';
        } else {
          predictedArrivalMinutes  = -predictedArrivalMinutes;
          predictedArrivalInfo = predictedArrivalMinutes + ' min ago';
        }
        var delayOrEarly = Math.round((predictedArrivalTime - scheduledArrivalTime)/(1000*60));

        var delayOrEarlyInfo = '';
        if (delayOrEarly > 0) {
          delayOrEarlyInfo = delayOrEarly + ' min delay';
        } else if (delayOrEarly === 0) {
          delayOrEarlyInfo = 'on time';
        } else {
          delayOrEarly  = -delayOrEarly;
          delayOrEarlyInfo = delayOrEarly + ' min early';
        }
        console.log(routeShortName + ' ' + scheduledArrivalTime);

        var tripHeadsign = arrivalsAndDepartures[i].tripHeadsign;

        busTimeItems.push({
          title: routeShortName + ', ' + predictedArrivalInfo,
          subtitle: delayOrEarlyInfo + ', ' + tripHeadsign
        });

        busDetails.push(arrivalsAndDepartures[i]);
      }
    }
  } else if (region === "newyork") {
    // console.log(JSON.stringify(busData.Siri));
    var arrivalsAndDepartures = busData.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
    // console.log(JSON.stringify(busData.Siri.ServiceDelivery.StopMonitoringDelivery[0]));
    // console.log(JSON.stringify(busData.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit));
    // console.log(JSON.stringify(arrivalsAndDepartures));
    for (var i = 0; i < arrivalsAndDepartures.length; i++)  {
      var monitoredInfo = arrivalsAndDepartures[i].MonitoredVehicleJourney;
      var routeShortName = monitoredInfo.PublishedLineName;
      var predictedArrivalTime = new Date();
      var predictedArrivalInfo = "";
      var tripHeadsign = monitoredInfo.DestinationName;
      if (monitoredInfo.MonitoredCall.hasOwnProperty("ExpectedArrivalTime")) {
        predictedArrivalTime = new Date(monitoredInfo.MonitoredCall.ExpectedArrivalTime);
        predictedArrivalInfo = ', in ' + parseTimeDisplay((predictedArrivalTime.getTime() - nowTime)/1000) + ' min';
      } else {
        predictedArrivalInfo = ', ' + monitoredInfo.MonitoredCall.Extensions.Distances.PresentableDistance;
      }
      busTimeItems.push({
        title: routeShortName + predictedArrivalInfo,
        subtitle: tripHeadsign
      });
    }
  } else if (region === "boston") {
    for (var i = 0; i < (busData.mode || []).length; i++) {
      var mode = busData.mode[i];
      for (var j = 0; j < mode.route.length; j++) {
        var route = mode.route[j];
        for (var k = 0; k < route.direction.length; k++) {
          var direction = route.direction[k];
          for (var l = 0; l < direction.trip.length; l++) {
            var trip = direction.trip[l];
            busTimeItems.push({
                title: route.route_id + ', in ' + parseTimeDisplay(trip.pre_away) + ' min',
                subtitle: trip.trip_headsign
            });
          }
        }
      }
    }
    busTimeItems = sortByKeyTime(busTimeItems, "title");
  }

  if(busTimeItems.length === 0) {
    busTimeItems = [{
      title: "No buses",
      subtitle: "For the next 30 min"
    }];
    console.log('empty busTimeItems');
  }

  busTimeItems.push({
    title: "Save as favorite",
    subtitle: "Show this bus stop info in the starting page when around."
  })

  busTimeItems.push({
    title: "Nearby stop list",
    subtitle: "Go to the full stop list."
  })

  busTimeItems.push({
    title: "Settings",
    subtitle: "CatchOneBus settings"
  })

  var busRealTimeInfo = {
    "busTimeItems": busTimeItems,
    "busDetails": busDetails
  };

  // Finally return whole array
  return busRealTimeInfo;
}

var parseTimeDisplay = function(timeInSec) {
  var timeToDisplay = parseInt(timeInSec)/60.0;
  if (timeToDisplay > 5) {
    return timeToDisplay.toFixed(0);
  } else {
    timeToDisplay = timeToDisplay.toFixed(1);
    if (timeToDisplay.split('.')[1] === "0") {
      return timeToDisplay.split('.')[0];
    } else {
      return timeToDisplay;
    }
  }
}

var sortByKeyTime = function(array, key) {
    return array.sort(function(a, b) {
        var x = a[key].split(" in ")[1].split(" ")[0]; var y = b[key].split(" in ")[1].split(" ")[0];
        x = parseInt(x);
        y = parseInt(y);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

var busInfo = function(data, busId) {
  // search through references to find bus name
  var routes = data.data.references.routes
  for (var i = 0; i < routes.length; i++) {
    if (routes[i].id === busId) {
      return routes[i];
    }
  }
  return null;
}

var dataList = function(data, region) {
  if (region === "boston") {
    var list = [];
    for (var i = 0; i < data.stop.length; i++) {
      if (data.stop[i].parent_station_name.length === 0) {
        list.push(data.stop[i]);
      }
    }
    return list;
  } else {
    return data.data.list || data.data.stops;
  }
}

var parseFeed = function(data, region) {
  var items = [];
  var list = dataList(data, region);
  for (var i = 0; i < list.length; i++) {
    // Always upper case the description string
    var title = list[i].name || list[i].stop_name;
    var busStopId = list[i].id||list[i].stop_id
    title = title + ',' + busStopId
    var direction = list[i].direction || "";
    var routes = [];
    var routesName = "";
    var parentStationName = ""
    if (region === "pugetsound") {
      var routeIds = list[i].routeIds;
      for (var k = 0; k < routeIds.length; k++ ) {
        var busDetail = busInfo(data, routeIds[k]);
        routes.push(busDetail.shortName);
      }
    } else if (region === "newyork") {
      var routeData = list[i].routes;
      for (var k = 0; k < routeData.length; k++ ) {
        routes.push(routeData[k].shortName);
      }
    } else if (region === "tampa") {
      var routeData = list[i].routeIds;
      for (var k = 0; k < routeData.length; k++ ) {
        str = routeData[k]
        routeName = str.slice(str.indexOf("Transit_") + 8, str.length);
        routes.push(routeName);
      }
    } else if (region === "boston") {
      if (title.indexOf("@") > -1) {
        direction = title.substr(title.indexOf("@"));
        title = title.replace(direction, "");
      }
    }
    routesName = routes.toString();
    if (routesName.length > 0) {
      routesName = ', ' + routesName;
    }
    // Add to menu items array
    if (title.length > 0) {
      items.push({
        title: title,
        subtitle: direction + routesName
      });
    }
  }

  if (list.length === 0) {
    items = [{
      title: "No Bus Stop Around",
      subtitle: "No bus stop in 260 m radius."
    }];
  }

  items.push({
    title: "Settings",
    subtitle: "CatchOneBus settings"
  })

  // Finally return whole array
  return items;
};

var busStopIds = function(data, region) {
  var stopIds = [];
  var list = dataList(data, region);
  for (var i = 0; i < list.length; i++) {
    stopIds.push(list[i].id||list[i].stop_id);
  }
  console.log(stopIds);
  return stopIds;
}

// geoRegion based on latitude and longitude
var geoRegion = function(latitude,longitude) {
  if (latitude > 45 && latitude < 49 && longitude > -124 && longitude < -120) {
    return "pugetsound";
  } else if (latitude > 40 && latitude < 41 && longitude > -74.5 && longitude < -73) {
    return "newyork";
  } else if (latitude > 27.63 && latitude < 28.26 && longitude > -82.7 && longitude < -82.0) {
    return "tampa";
  } else if (latitude > 42.19 && latitude < 42.48 && longitude > -71.27 && longitude < -70.85) {
    return "boston";
  }
  return null;
}

var urlBus = function(type, region) {
  urlSource = {
    "stopsForLocations": {
      "pugetsound": "api.pugetsound.onebusaway.org/api/where/stops-for-location.json?key=",
      "newyork":
      "bustime.mta.info/api/where/stops-for-location.json?key=",
      "tampa":
      "api.tampa.onebusaway.org/api/where/stops-for-location.json?key=",
      "boston":
      "realtime.mbta.com/developer/api/v2/stopsbylocation?api_key="
    },
    "routesForStops": {
      "pugetsound":
      "api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/",
      "newyork":
      "bustime.mta.info/api/siri/stop-monitoring.json?key=",
      "tampa":
      "api.tampa.onebusaway.org/api/where/arrivals-and-departures-for-stop/",
      "boston":
      "realtime.mbta.com/developer/api/v2/predictionsbystop?api_key="
    }
  }
  return "http://" + urlSource[type][region]
}

// var apiKey = function(region) {
//   key = {
//     "pugetsound" : KEY_PUGET_SOUND,
//     "newyork": KEY_NEW_YORK,
//     "tampa": KEY_TAMPA,
//     "boston": KEY_BOSTON
//   }
//   return key[region]
// }

var urlBusPugetSound = "http://api.pugetsound.onebusaway.org/api/where/arrival-and-departure-for-stop/";
var urlBusTampa = "http://api.tampa.onebusaway.org/api/where/arrival-and-departure-for-stop/";

var urlStopsForLocations = function(latitude, longitude) {
  var region = geoRegion(latitude,longitude);
  var radius = Settings.data()["searchRadius"] || 260;
  var latlon = "&lat=" + latitude + "&lon=" + longitude;
  if (arrayContains(["pugetsound","newyork","tampa"], region)) {
    return urlBus("stopsForLocations", region) + KEY[region] + latlon + "&radius=" + radius;
  } else if (region === "boston") {
    return urlBus("stopsForLocations", region) + KEY[region] + latlon + "&format=json";
  }
  return null;
}

var urlRoutesForStops = function(latitude, longitude, busStopId) {
  var region = geoRegion(latitude,longitude);
  if (region === "pugetsound") {
    return urlBus("routesForStops", region) + busStopId + ".json?key="+ KEY[region];
  } else if (region === "newyork") {
    return urlBus("routesForStops", region) + KEY[region] + "&OperatorRef=MTA" + "&MonitoringRef=" + busStopId;
  } else if (region === "tampa") {
    return encodeURI(urlBus("routesForStops", region) + busStopId + ".json?key="+ KEY[region]);
  } else if (region === "boston") {
    return urlBus("routesForStops", region) + KEY[region] + "&stop=" + busStopId + "&format=json";
  }
  return null;
}

var urlRoutesForBus = function(latitude, longitude, busDetail) {
  var region = geoRegion(latitude,longitude);
  if (region === "pugetsound") {
    return urlBusPugetSound + busDetail.stopId + ".json?key="+ KEY_PUGET_SOUND + "&tripId=" + busDetail.tripId + "&serviceDate=" + busDetail.serviceDate + "&vehicleId=" + busDetail.vehicleId + "&stopSequence=" + busDetail.stopSequence;
  } else if (region === "tampa") {
    return encodeURI(urlBusTampa + busDetail.stopId + ".json?key="+ KEY_TAMPA + "&tripId=" + busDetail.tripId + "&serviceDate=" + busDetail.serviceDate + "&vehicleId=" + busDetail.vehicleId + "&stopSequence=" + busDetail.stopSequence);
  }
  return null;
}

// helper methods
var arrayContains = function(array, item) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === item) {
      return true;
    }
  }
  return false;
}
