AWS.config.update({region: 'eu-west-1'}); 
// Initialize the Amazon Cognito credentials provider
var creds = new AWS.CognitoIdentityCredentials({
 IdentityPoolId: 'eu-west-1:f522a283-1d50-4682-b00d-299bc2407401'
});
AWS.config.credentials = creds;
var thingShadow = new AWS.IotData({endpoint: 'a2fcj0ob99ycmb.iot.eu-west-1.amazonaws.com'});
var myParam = location.search.split('thing=')[1];
checkLEDStatus();

function setShadow(){
	let thingName = myParam;
	console.log("Shadow registration called");
	document.getElementById("sendReq").disabled = true;
	var params = {
	  thingName: thingName /* required */
	};
	thingShadow.getThingShadow(params, function(err, data) {
  		if (err) 
  			console.log(err, err.stack); // an error occurred
  		else{
  			console.log(data.payload);
  			let tmp = JSON.parse(data.payload);
  			console.log(tmp.state.reported.LED_value);
  			if (tmp.state.reported.LED_value == "On")
  				switch_off(thingName);
  			else
  				switch_on(thingName);
  		}     
  	});
}

function switch_on(thingName){
	let tmp = '{"state":{"desired": {"LED_value": "On"}}}';
	let params = {
	  payload: tmp,/* Strings will be Base-64 encoded on your behalf */ //required
	  thingName: thingName /* required */
	};
	thingShadow.updateThingShadow(params, function(err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else{
		console.log(data);// successful response
	  }
	  //re-enable switch-led button
	  document.getElementById("sendReq").disabled = false;
	});
}

function switch_off(thingName){
	console.log("Switching off");
	try{
		let tmp = '{"state":{"desired": {"LED_value": "Off"}}}';
		let params = {
		  payload: tmp,/* Strings will be Base-64 encoded on your behalf */ //required
		  thingName: thingName /* required */
		};
	
		thingShadow.updateThingShadow(params, function(err, data) {
		  if (err) console.log(err, err.stack); // an error occurred
		  else{
		  	console.log(data);           // successful response
		  }
		//re-enable switch-led button
	  	document.getElementById("sendReq").disabled = false;
		});
	}catch(err){
		console.log(err);
	}
}

function checkLEDStatus() {
	let params = {
		  thingName: myParam //"00:80:E1:B4:D1:FA" /* required */
		};
		thingShadow.getThingShadow(params, function(err, data) {
	  		if (err) 
	  			console.log(err, err.stack); // an error occurred
	  		else{
	  			//console.log(data.payload);
	  			let tmp = JSON.parse(data.payload);
	  			document.getElementById('myTextArea').innerHTML = tmp.state.reported.LED_value;
	  		}     
	});
}

$(function() {
  checkLEDStatus();
  $.ajaxSetup({ cache: false });
  setInterval(checkLEDStatus, 1000);
});