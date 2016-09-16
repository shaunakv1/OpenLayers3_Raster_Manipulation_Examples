/**
 * Setup landcover tile cache layer as a raster layer
 */
var landcover = new ol.source.Raster({
  sources: [
    new ol.source.XYZ({
      url: 'https://coast.noaa.gov/arcgis/rest/services/CCAP/CCAP_landcover_2010/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: 'anonymous'
    })
  ],
  operation: function(pixels, data) {
    var pixel = pixels[0];
    return pixel;
  },
  lib: {

  }
});
//raster.set('threshold', 0.1);

/**
 * Map Setup
 */

var attribution = new ol.Attribution({
  html: 'Tiles © <a href="http://services.arcgisonline.com/ArcGIS/' + 'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      })
    }),
    new ol.layer.Image({
      source: landcover
    })
  ],
  view: new ol.View({
    center: [-10802627.683927462, 4786251.5431982465],
    zoom: 5
  })
});

/**
 * Generate controls
 */

$(function() {
  landcoverClasses.forEach(function(i) {
    $('#controls').append('<section class="legenditem"> <span class="legendcolor" style="background-color:' + rgbaString(i.color) + '">&nbsp;</span> <span class="legendname">' + i.name + '</span> </section>');
  });
});

function rgbaString(color) {
  return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
}