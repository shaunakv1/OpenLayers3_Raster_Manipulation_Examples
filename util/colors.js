var colors = [];
$(function(){
	$('tr').each(function(i,ele){
		var name = $($(ele).find('td')[1]).text().trim() || "Unknown"; 
		var img = $(ele).find('img')[0];
		var canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
		var pixelData = canvas.getContext('2d').getImageData(10, 10, 1, 1).data;
		//console.log(pixelData, name);
		colors.push({
			name: name,
			color: Array.prototype.slice.call(pixelData)
		});
	});	
	//console.log(colors);
	console.log(JSON.stringify(colors));
});

function bachRGBtoLab() {
	landcoverClasses.forEach(function(item,i){
		item.id = i;
		item.colorLab = rgb2lab(item.color)
	});
	console.log(JSON.stringify(landcoverClasses));
}