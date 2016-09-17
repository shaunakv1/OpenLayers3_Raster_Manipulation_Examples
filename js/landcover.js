//checkout : https://www.npmjs.com/package/pixelmatch
//http://zschuessler.github.io/DeltaE/
//https://github.com/antimatter15/rgb-lab/blob/master/color.js

var modifyPixel = function(pixel, landcoverClass) {
    var R = 0,G = 1,B = 2,A = 3;
    
    if (landcoverClass) {
      var matchLab = landcoverClasses[landcoverClass].colorLab;
      var pixelLab = rgb2lab(pixel);
      var deltaEDiff = deltaE(matchLab, pixelLab);

      if (deltaEDiff > 3.0) {
        pixel[A] = 0;
      }
    }

    return pixel;
  }

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
    return modifyPixel(pixel, data.lc_class);
  },
  lib: {
    landcoverClasses: landcoverClasses,
    rgb2lab: rgb2lab,
    lab2rgb: lab2rgb,
    deltaE: deltaE,
    modifyPixel: modifyPixel
  }
});
landcover.set('lc_class', null);

landcover.on('beforeoperations', function(event) {
  event.data.lc_class = landcover.get('lc_class');
});

landcover.on('afteroperations', function(event) {
  
});

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
    $('#controls').append('<section class="legenditem" data-color-id="' + i.id + '"> <span class="legendcolor" style="background-color:' + rgbaString(i.color) + '">&nbsp;</span> <span class="legendname">' + i.name + '</span> </section>');
  });
  $('.legenditem').on('click', function(evt) {
    landcover.set('lc_class', $(this).data('color-id'));
    landcover.changed();
  });
});

function rgbaString(color) {
  return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
}