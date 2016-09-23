//checkout : https://www.npmjs.com/package/pixelmatch
//http://zschuessler.github.io/DeltaE/
//https://github.com/antimatter15/rgb-lab/blob/master/color.js

var modifyPixel = function(pixel, data) {
    var R = 0,G = 1,B = 2,A = 3;
    
    if(pixel[A] > 0) {
      data.total += 1;
      var c = data.colorStats[pixel[0] + "-" + pixel[1] + "-" + pixel[2]];
      c = c || 0;
      c += 1;
      data.colorStats[pixel[0] + "-" + pixel[1] + "-" + pixel[2]] = c;
    }
    return pixel;//[0,0,0,0]//pixel;
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
  event.data.colorStats = {};
  event.data.classes = landcoverClasses;
  event.data.classes.forEach(function (lcaClass) {
    lcaClass.count = 0;
  });
});

landcover.on('afteroperations', function(event) {
  Object.keys(event.data.colorStats).forEach(function(c){
    
    
    // if new pixels are found
    if(event.data.classes[matchMap[c]] === undefined) {
      var cArr = c.split("-");
      var pixel = [parseInt(cArr[0]),parseInt(cArr[1]),parseInt(cArr[2])];
      event.data.classes.forEach(function (lcaClass,i) {
        if(i > 0){
          var matchLab = lcaClass.colorLab;  
          var pixelLab = rgb2lab(pixel);
          var deltaEDiff = deltaE(matchLab, pixelLab);
          if (deltaEDiff < 3.0) {
            //console.log(c + " ---------> " +  lcaClass.id);
            lcaClass.count = event.data.colorStats[c]
          }
          else{
            //console.log("no Match for: ", c)
          }          
        }
      });
    }
    else{
      event.data.classes[matchMap[c]].count = event.data.colorStats[c];
    }
    
  });
  //console.log(matchMap);
  scheduleStats({
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
    }),/*
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        url: 'https://coast.noaa.gov/arcgis/rest/services/CCAP/CCAP_landcover_2010/MapServer/tile/{z}/{y}/{x}'
      })
    }),*/
    new ol.layer.Image({
      source: landcover
    })
  ],
  view: new ol.View({
    center: [-10812411.623547956, 5050417.912951814],
    zoom: 4
  })
});

/**
 * Generate controls
 */

$(function() {
  initializeChart();
  landcoverClasses.forEach(function(i) {
    $('#controls').append('<section id="class_'+i.id+'" class="legenditem" data-color-id="' + i.id + '"> <span class="legendcolor" style="background-color:' + rgbaString(i.color) + '">&nbsp;</span> <span class="legendname">' + i.name + '</span> <span class="value" ></span></section>');
  });
  $('.legenditem').on('click', function(evt) {
    landcover.set('lc_class', $(this).data('color-id'));
    landcover.changed();
    
    scheduleStats({title: $(this).find('.legendname').text()});
  });
});

var timer = null;
function scheduleStats(stats,resolution) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(function(){ displayStats(stats,resolution) }, 1000);
}

function displayStats(stats,resolution){
  console.log("displaying stats");

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

function initializeChart(){
  return $('#pieChart').highcharts({
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
                      enabled: true
                  }
              }
          },
          series: [{
            name: 'Classes',
            colorByPoint: true,
            data: []
        }]
      });
}

function renderChart(data){
  var chart = $("#pieChart").highcharts();
  chart.series[0].setData(data, true);
}