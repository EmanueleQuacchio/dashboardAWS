'use strict';

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

console.log('Loading function');

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? console.error("Unable to query. Error:", JSON.stringify(err, null, 2)) : JSON.stringify(res.items),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    const get_done = function (err, res){
      if (!err){
        res = undefined;
      }  
    };
    
    var d = new Date();
    var t = d.getTime();

    console.log('Temperature =', event.Temperature);
    console.log('Humidity =', event.Humidity);
    console.log('Pressure =', event.Pressure);
    var ttl = parseInt((t/1000) + (48*60*60));
    console.log("TTL: ", ttl);
    var params;
    if ("yaw" in event){
        params = {
            Item: {
                metric: event.Board_id,
                timestamp: t,
                TTL: ttl,
                temperature: event.Temperature,
                humidity: event.Humidity,
                pressure: event.Pressure,
                gyr_x: event['GYR-X'],
                gyr_y: event['GYR-Y'],
                gyr_z: event['GYR-Z'],
                acc_x: event['ACC-X'],
                acc_y: event['ACC-Y'],
                acc_z: event['ACC-Z'],
                mag_x: event['MAG-X'],
                mag_y: event['MAG-Y'],
                mag_z: event['MAG-Z'],
                axis_x: event['roll'],
                axis_y: event['yaw'],
                axis_z: event['pitch']
            },
            TableName: "nucleo-metrics"
        };
    }else{
        params = {
            Item: {
                metric: event.Board_id,
                timestamp: t,
                TTL: ttl,
                temperature: event.Temperature,
                humidity: event.Humidity,
                pressure: event.Pressure,
                gyr_x: event['GYR-X'],
                gyr_y: event['GYR-Y'],
                gyr_z: event['GYR-Z'],
                acc_x: event['ACC-X'],
                acc_y: event['ACC-Y'],
                acc_z: event['ACC-Z'],
                mag_x: event['MAG-X'],
                mag_y: event['MAG-Y'],
                mag_z: event['MAG-Z']
            },
            TableName: "nucleo-metrics"
        };
    }
    dynamo.putItem(params, done);
    callback(null, "DONE");  // Echo back the first key value
    //callback('Something went wrong');
};
