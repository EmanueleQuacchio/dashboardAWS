var lambdaEndpoint = "https://xnziej1sx7.execute-api.eu-west-1.amazonaws.com/test";
var lambdaPath = "/proxy";
/* Create the context for applying the chart to the HTML canvas */
var tctx = $("#temperaturegraph").get(0).getContext("2d");
var hctx = $("#humiditygraph").get(0).getContext("2d");
var pctx = $("#pressuregraph").get(0).getContext("2d");

var myParam = location.search.split('thing=')[1];
console.log(myParam);
/* Set the options for our chart */
var options = { 
  responsive: true,
  showLines: true,
  scales: {
    xAxes: [{
      display: true
    }],
    yAxes: [{
      ticks: {
        beginAtZero:true
      }
    }]
  } 
};
var pressureOptions = { 
  responsive: true,
  showLines: true,
  scales: {
    xAxes: [{
      display: true
    }],
    yAxes: [{
      ticks: {
        min: 870,
        max: 1085
      }
    }]
  } 
};
/* Set the inital data */
var tinit = {
  labels: [],
  datasets: [
    {
        yAxisID : 'y-axis-0',
        label: "Temperature °C ",
        backgroundColor: 'rgba(204,229,255,0.5)',
        borderColor: 'rgba(153,204,255,0.75)',
        data: []
    }
  ]
};
var hinit = {
  labels: [],
  datasets: [
    {
        label: "Humidity % ",
        backgroundColor: 'rgba(204,204,255,0.5)',
        borderColor: 'rgba(204,153,255,0.75)',
        data: []
    }
  ]
};
var pinit = {
  labels: [],
  datasets: [
    {
        label: "Pressure hPa ",
        backgroundColor: 'rgba(50,50, 150, 0.4)',
        borderColor: 'rgba(50, 50, 150, 0.8)',
        data: []
    }
  ]
};
Chart.defaults.NegativeTransparentLine = Chart.helpers.clone(Chart.defaults.line);
Chart.controllers.NegativeTransparentLine = Chart.controllers.line.extend({
  update: function() {
    // get the min and max values
    var min = Math.min.apply(null, this.chart.data.datasets[0].data);
    var max = Math.max.apply(null, this.chart.data.datasets[0].data);
    console.log("Min: ", min, "Max: ", max);
    var yScale = this.getScaleForId(this.getDataset().yAxisID);

    // figure out the pixels for these and the value 0
    var top = yScale.getPixelForValue(max) || 0;
    var zero = yScale.getPixelForValue(0);
    var bottom = yScale.getPixelForValue(min) || 0;
    var yminvalue = 0;
    if (min < 0)
      yminvalue = yScale.getPixelForValue(min);
    else
      yminvalue = 0;

    console.log("top: "+ top + " bottom: "+ bottom+ "minvalue: " + yScale.getPixelForValue(20));
    // build a gradient that switches color at the 0 point
    var ctx = this.chart.chart.ctx;
    var gradient = ctx.createLinearGradient(0, top, 0, bottom);
    var ratio = Math.min((yScale.getPixelForValue($('#threshold').val()) - top) / (bottom - top), 1);
    if (ratio > 1 || ratio < 0)
      ratio=0;
    console.log($('#threshold').val());
    gradient.addColorStop(0, 'rgba(254,0,0,0.4)');
    gradient.addColorStop(ratio, 'rgba(254,0,0,0.4)');
    gradient.addColorStop(ratio, 'rgba(75,192,192,0.4)');
    gradient.addColorStop(1, 'rgba(75,192,192,0.4)');
    console.log(this.chart.data.datasets[0]);
    //if(this.chart.data.datasets[0].data)
    if ($('#threshold').val() < max){
    this.chart.data.datasets[0].backgroundColor = gradient;
    this.chart.data.datasets[0].borderColor = gradient;
    }else{
      this.chart.data.datasets[0].backgroundColor = 'rgba(75,192,192,0.4)';
      this.chart.data.datasets[0].borderColor = 'rgba(75,192,192,0.6)';
    }
    //this.chart.data.datasets[0].borderColor = gradient;
    return Chart.controllers.line.prototype.update.apply(this, arguments);
  
}
});

var temperaturegraph = new Chart(tctx, {type: 'NegativeTransparentLine', data: tinit, options: options});
var humiditygraph = new Chart.Line(hctx, {data: hinit, options: options});
var pressuregraph = new Chart.Line(pctx, {data: pinit, options: pressureOptions});

$(function() {
  getData();
  $.ajaxSetup({ cache: false });
  setInterval(getData, 10000);
});


//** Gyroscope data rendering functions **//
var deviceOrientationData ={alpha:0,beta:0,gamma:0};//init with 0 as defaults
//returns a 3D box like object centered around the origin. There are more than 8 points for this cube as it is being made by chaining together a strip of triangles 
//so points are redundant at least 3x.
function makeRect(width,height,depth)
{
  var newObj={};
  var hw=width/4;
  var hh=height/4;
  var hd=depth/4;
  newObj.vertices=[  [-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd],//first triangle
          [-hw,hh,hd],[-hw,-hh,hd],[hw,-hh,hd],//2 triangles make front side
          [-hw,hh,-hd],[-hw,hh,hd],[-hw,-hh,-hd], //left side
          [-hw,hh,hd],[-hw,-hh,hd],[-hw,-hh,-hd],
          [hw,hh,-hd],[hw,hh,hd],[hw,-hh,-hd], //right side
          [hw,hh,hd],[hw,-hh,hd],[hw,-hh,-hd],
          [-hw,hh,-hd],[hw,hh,-hd],[hw,-hh,-hd],//back
          [-hw,hh,-hd],[-hw,-hh,-hd],[hw,-hh,-hd],
          [-hw,hh,-hd],[hw,hh,-hd],[hw,hh,hd],//top
          [-hw,hh,-hd],[-hw,hh,hd],[hw,hh,hd],
          [-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],//bottom
          [-hw,-hh,-hd],[-hw,-hh,hd],[hw,-hh,hd]
  ];
  
  return newObj;
}
var canvas = document.getElementById("gyroCanvas");
var cube=makeRect(canvas.width/5,canvas.width/5,canvas.width/5);
cube.color="black";
//cube.label="black";
var xAxis=makeRect(440,10,10);
xAxis.color="red";
var yAxis=makeRect(10,440,10);
yAxis.color="green";
var zAxis=makeRect(10,10,440);
zAxis.color="blue";

var context = canvas.getContext("2d");
context.canvas.width  = canvas.width;//resize canvas to whatever window dimensions are
context.canvas.height = canvas.height;
context.translate(canvas.width / 2, canvas.height / 2); //put 0,0,0 origin at center of screen instead of upper left corner
function renderObj(obj)//renders an object as a series of triangles
{
    var rotatedObj=rotateObject(obj);
    context.lineWidth = 1;
    context.strokeStyle = obj.color;
    context.fillStyle = obj.color;

    
    for(var i=0 ; i<obj.vertices.length ; i+=3)
    {
        for (var k=0;k<3;k++)
        {
          var vertexFrom=rotatedObj.vertices[i+k];
          var temp=i+k+1;
          if(k==2) 
              temp=i;
              
          var vertexTo=rotatedObj.vertices[temp];
          context.beginPath();
          context.moveTo(vertexFrom[0], -vertexFrom[1]);
          context.lineTo(vertexTo[0], -vertexTo[1]);
          context.stroke();
          //context.fill();
        }
    }
}
function rotateObject(obj) //rotates obeject
{
    var newObj={};
    newObj.vertices=[];
    for(var i=0 ; i<obj.vertices.length ; i++)
    {
      newObj.vertices.push(rotatePointViaGyroEulars(obj.vertices[i]));
    }
    return newObj;
}    

function rotatePointViaGyroEulars(ra) //rotates 3d point based on euler angles
{
  var oldX=ra[0];
  var oldY=ra[1];
  var oldZ=ra[2];
  
  //order here is important – it must match the processing order of the device
  
  //rotate about z axis
  var newX = oldX * Math.cos(-degToRad(deviceOrientationData.alpha)) - oldY * Math.sin(-degToRad(deviceOrientationData.alpha));
  var newY = oldY * Math.cos(-degToRad(deviceOrientationData.alpha)) + oldX * Math.sin(-degToRad(deviceOrientationData.alpha));
  
  //rotate about x axis
  oldY=newY;
  newY = oldY * Math.cos(-degToRad(deviceOrientationData.gamma)) - oldZ * Math.sin(-degToRad(deviceOrientationData.gamma));
  var newZ = oldZ * Math.cos(-degToRad(deviceOrientationData.gamma)) + oldY * Math.sin(-degToRad(deviceOrientationData.gamma));

  
  //rotate about y axis
  oldZ=newZ;
  oldX=newX;

  newZ = oldZ * Math.cos(-degToRad(deviceOrientationData.beta)) - oldX * Math.sin(-degToRad(deviceOrientationData.beta));
  newX = oldX * Math.cos(-degToRad(deviceOrientationData.beta)) + oldZ * Math.sin(-degToRad(deviceOrientationData.beta));

  
  return [newX,newY,newZ];
}
  
function degToRad(deg)// Degree-to-Radian conversion
{
     return deg * Math.PI / 180; 
}


//render loop
function renderLoop() 
{
  requestAnimationFrame( renderLoop );//better than set interval as it pauses when browser isn’t active
  context.clearRect( -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);//clear screen x, y, width, height
    renderObj(cube);
    renderObj(xAxis);
    renderObj(yAxis);
    renderObj(zAxis);
}

renderLoop();


//*****************************************//


/* Makes a query of the DynamoDB table to set a data object for the chart */
function getData() {
  var actual_data = new Date();
  //alert($('#since').val());
  var since = actual_data - ($('#since').val()*60*60*1000);
  //show the latest 24 hours
  //console.log(since.getTime() - 86400000);

  $.getJSON(lambdaEndpoint+ lambdaPath + "?TableName=nucleo-metrics&since=" + since + "&board_id=" + myParam, function(data) {
    //console.log(data);
// placeholders for the data arrays
      console.log(data.body);
      var temperatureValues = [];
      var humidityValues = [];
      var pressureValues = [];
      var labelValues = [];
// placeholders for the data read
      var temperatureRead = 0.0;
      var humidityRead = 0.0;
      var pressureRead = 0.0;
      var timeRead = "";
// placeholders for the high/low markers
      var temperatureHigh = -999.0;
      var humidityHigh = -999.0;
      var pressureHigh = -999.0;
      var temperatureLow = 999.0;
      var humidityLow = 999.0;
      var pressureLow = 9999.0;
      var temperatureHighTime = "";
      var temperatureLowTime = "";
      var humidityHighTime = "";
      var humidityLowTime = "";
      var pressureHighTime = "";
      var pressureLowTime = "";
      data = JSON.parse(data.body);
for (var i in data) {
        // read the values from the dynamodb JSON packet

        temperatureRead = parseFloat(data[i]['temperature']);
        humidityRead = parseFloat(data[i]['humidity']);
        pressureRead = parseFloat(data[i]['pressure']);
        date = new Date(parseFloat(data[i]['timestamp']));//new Date(data['Items'][i]['payload']['M']['datetime']['S']);
        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        var timeRead = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
// check the read values for high/low watermarks
        if (temperatureRead < temperatureLow) {
          temperatureLow = temperatureRead;
          temperatureLowTime = timeRead;
        }
        if (temperatureRead > temperatureHigh) {
          temperatureHigh = temperatureRead;
          temperatureHighTime = timeRead;
        }
        if (humidityRead < humidityLow) {
          humidityLow = humidityRead;
          humidityLowTime = timeRead;
        }
        if (humidityRead > humidityHigh) {
          humidityHigh = humidityRead;
          humidityHighTime = timeRead;
        }
        if (pressureRead < pressureLow) {
          pressureLow = pressureRead;
          pressureLowTime = timeRead;
        }
        if (pressureRead > pressureHigh) {
          pressureHigh = pressureRead;
          pressureHighTime = timeRead;
        }
// append the read data to the data arrays
        temperatureValues.push(temperatureRead);
        humidityValues.push(humidityRead);
        pressureValues.push(pressureRead);
        labelValues.push(timeRead);
      }
// set the chart object data and label arrays
      temperaturegraph.data.labels = labelValues;
      temperaturegraph.data.datasets[0].data = temperatureValues;
      humiditygraph.data.labels = labelValues;
      humiditygraph.data.datasets[0].data = humidityValues;
      pressuregraph.data.labels = labelValues;
      pressuregraph.data.datasets[0].data = pressureValues;
// redraw the graph canvas
      temperaturegraph.update();
      humiditygraph.update();
      pressuregraph.update();
      let alpha=0, beta=0, gamma=0;
      if (data[data.length-1]){
        alpha=data[data.length-1].alpha;
        beta=data[data.length-1].beta;
        gamma=data[data.length-1].gamma;
      }
      console.log("alpha: ", alpha);
      //console.log("beta: ", data[data.length-1].gyr_y);
      //console.log("gamma: ", data[data.length-1].gyr_z);
      deviceOrientationData.alpha=alpha;
      deviceOrientationData.beta=beta;
      deviceOrientationData.gamma=gamma;
      if (!data.length){
        console.log("Board disconnected");
        var c = document.getElementById("boardStatus");
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle="red";
        ctx.beginPath();
        ctx.arc(17, 13, 9, 0, 2 * Math.PI);
        ctx.fill();
      }else{
        var seconds = new Date().getTime() / 1000;
        let tmp_ref = parseFloat(data[data.length-1]['timestamp'])/1000;
        if (tmp_ref+21 < parseFloat(seconds)){
          console.log("Board disconnected");
          var c = document.getElementById("boardStatus");
          var ctx = c.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle="red";
          ctx.beginPath();
          ctx.arc(17, 13, 9, 0, 2 * Math.PI);
          ctx.fill();
        }else{
          console.log("Board connected");
          var c = document.getElementById("boardStatus");
          var ctx = c.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle="green";
          ctx.beginPath();
          ctx.arc(17, 13, 9, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

// update the high/low watermark sections
      $('#t-high').text(Number(temperatureHigh).toFixed(2).toString() + '°C at ' + temperatureHighTime);
      $('#t-low').text(Number(temperatureLow).toFixed(2).toString() + '°C at ' + temperatureLowTime);
      $('#h-high').text(Number(humidityHigh).toFixed(2).toString() + '% at ' + humidityHighTime);
      $('#h-low').text(Number(humidityLow).toFixed(2).toString() + '% at ' + humidityLowTime);
      $('#p-high').text(Number(pressureHigh).toFixed(2).toString() + ' hPa at ' + pressureHighTime);
      $('#p-low').text(Number(pressureLow).toFixed(2).toString() + ' hPa at ' + pressureLowTime);
      $('#alpha').text(Number(alpha).toFixed(2).toString());
      $('#beta').text(Number(beta).toFixed(2).toString());
      $('#gamma').text(Number(gamma).toFixed(2).toString());

  });
}

// checks every second if a chart option is changed and updates it immediately
$(function() {
  checkOptions();
  $.ajaxSetup({ cache: false });
  setInterval(checkOptions, 1000);
});

var sinceTimeOption = $('#since').val();
var thresholdOption = $('#threshold').val();

function checkOptions(){
  let nowSince = $('#since').val();
  let nowThreshold = $('#threshold').val();
  if (sinceTimeOption != nowSince || thresholdOption != nowThreshold){
    getData();
    sinceTimeOption= nowSince;
    thresholdOption= nowThreshold;
  }
}

