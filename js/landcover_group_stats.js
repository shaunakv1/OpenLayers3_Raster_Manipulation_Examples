//checkout : https://www.npmjs.com/package/pixelmatch
//http://zschuessler.github.io/DeltaE/
//https://github.com/antimatter15/rgb-lab/blob/master/color.js

var modifyPixel = function(pixel, data) {
    var R = 0,G = 1,B = 2,A = 3;
    
    if(pixel[A] > 0) data.total += 1;

    data.classes.forEach(function (lcaClass,i) {
      if(i > 0){
        var matchLab = lcaClass.colorLab;  
        var pixelLab = rgb2lab(pixel);
        var deltaEDiff = deltaE(matchLab, pixelLab);
        if (deltaEDiff < 3.0) lcaClass.count += 1;  
      }
    });
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
    return modifyPixel(pixel, data);
  },
  lib: {
    landcoverClasses: landcoverClasses,
    rgb2lab: rgb2lab,
    lab2rgb: lab2rgb,
    deltaE: deltaE,
    modifyPixel: modifyPixel
  }
});
landcover.set('lc_class', 0);

landcover.on('beforeoperations', function(event) {
  event.data.total = 0;
  event.data.classes = landcoverClasses;
  event.data.classes.forEach(function (lcaClass) {
    lcaClass.count = 0;
  });
});

landcover.on('afteroperations', function(event) {
  displayStats({
    total: event.data.total,
    classes: event.data.classes
  },event.resolution);
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
    $('#controls').append('<section id="class_'+i.id+'" class="legenditem" data-color-id="' + i.id + '"> <span class="legendcolor" style="background-color:' + rgbaString(i.color) + '">&nbsp;</span> <span class="legendname">' + i.name + '</span> <span class="value" ></span></section>');
  });
  $('.legenditem').on('click', function(evt) {
    landcover.set('lc_class', $(this).data('color-id'));
    landcover.changed();
    
    displayStats({title: $(this).find('.legendname').text()});
  });
});

function displayStats(stats,resolution){
  if(stats.total) $('#stats #total').text(area(resolution,stats.total) + " square miles");
  if(stats.classes){
    var chartData = [];
    var check = 0;
    stats.classes.forEach(function (lcaClass) {
      $('#class_'+lcaClass.id).find(".value").text(percent(lcaClass.count,stats.total)+ "%");
      check = check + percent(lcaClass.count,stats.total);
      chartData.push({
        name: lcaClass.name,
        y: percent(lcaClass.count,stats.total),
        color: rgbString(lcaClass.color)
      });
    });
    console.log(check);
    renderChart(chartData);
  }  
//area(resolution,stats.class_total)
}

function percent(value,total){
  return Math.round((value * 100) / total); 
}
function area(resolution, meterCounts){
  return ((resolution * resolution * meterCounts) * 3.8610216e-07).toFixed(2) ; //convert sq mt to sq mi
}

function rgbString(color) {
  return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
}

function rgbaString(color) {
  return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
}

function renderChart(data){
  console.log(data);
  $('#pieChart').highcharts({
          chart: {
              plotBackgroundColor: null,
              plotBorderWidth: null,
              plotShadow: false,
              type: 'pie'
          },
          title: {
              text: null
          },
          tooltip: {
              pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
          },
          plotOptions: {
              pie: {
                  allowPointSelect: true,
                  cursor: 'pointer',
                  dataLabels: {
                      enabled: false
                  }
              }
          },
          series: [{
            name: 'Classes',
            colorByPoint: true,
            data: data
        }]
      });
}