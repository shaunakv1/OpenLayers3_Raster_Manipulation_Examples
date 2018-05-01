//checkout : https://www.npmjs.com/package/pixelmatch
//http://zschuessler.github.io/DeltaE/
//https://github.com/antimatter15/rgb-lab/blob/master/color.js

/**
 * pixelMatches Takes two rgb pixels and checks if they match
 * @param  {[type]} pixel1rgb [description]
 * @param  {[type]} pixel2rgb [description]
 * @return {[type]}           [description]
 */
var pixelMatches = function(pixel1rgb,pixel2rgb){
  var pixel1Lab = rgb2lab(pixel1rgb);
  var pixel2Lab = rgb2lab(pixel2rgb);
  var diff = deltaE(pixel1Lab, pixel2Lab);
  if(diff < 3.0 ) return true;
  else return false;

}

/**
 * isPixelIn checks if pixelrgb matches any pixels in pixelArray
 * @param  {Array[4]}  pixelrgb     [description]
 * @param  {Array[Array[4]]}  pixelrgbArray [description]
 * @param  {boolean}  isLab set to true if pixelArray is in Lab space, if not its converted to one
 * @return {Boolean}               [description]
 */
var isPixelIn = function(pixelrgb,pixelArray,isLab){
  var isLab = !!isLab;
  var pixelLab = rgb2lab(pixelrgb);
  pixelArray.forEach(function(p){
    if(!isLab) p = rgb2lab(p);
    var diff = deltaE(pixelLab, p);
    if(diff < 3.0 ) return true;
  });
  return false;
}

var modifyPixel = function(pixel1,pixel2, landcoverClass) {
    var R = 0,G = 1,B = 2,A = 3;
    //if (landcoverClass) {
      //var matchLab = landcoverClasses[landcoverClass].colorLab;
      //var deltaPixel1ToMatchLab = deltaE(matchLab, pixel1Lab);
      
      //we are looking at pixel on first raster that matches the class are trying to find change on other raster
      //if (deltaPixel1ToMatchLab < 3.0) {
        //if this source pixel changed in comparison raster
        if (pixel1[A] > 0 && pixel2[A] > 0 && !pixelMatches(pixel1, pixel2)) {
          return [255,0,0,255];
        }
      //}
    //}
    return [0,0,0,0];
  }

  /**
   * Setup landcover tile cache layer as a raster layer
   */
var landcover = new ol.source.Raster({
  sources: [
    new ol.source.XYZ({
      url: 'https://coast.noaa.gov/arcgis/rest/services/CCAP/CCAP_landcover_2006/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: 'anonymous'
    }),
    new ol.source.XYZ({
      url: 'https://coast.noaa.gov/arcgis/rest/services/CCAP/CCAP_landcover_2010/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: 'anonymous'
    })
  ],
  operation: function(pixels, data) {
    var pixel1 = pixels[0];
    var pixel2 = pixels[1];
    return modifyPixel(pixel1,pixel2, data.lc_class);
  },
  lib: {
    landcoverClasses: landcoverClasses,
    rgb2lab: rgb2lab,
    lab2rgb: lab2rgb,
    deltaE: deltaE,
    modifyPixel: modifyPixel,
    pixelMatches: pixelMatches,
    isPixelIn:isPixelIn
  },
  threads: 1
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
    console.log($(this).data('color-id'));
    landcover.set('lc_class', $(this).data('color-id'));
    landcover.changed();
  });
});

function rgbaString(color) {
  return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
}