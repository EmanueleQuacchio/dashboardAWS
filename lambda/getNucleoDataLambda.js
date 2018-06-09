'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    //console.log('TableName', event.params.querystring.TableName);
    //console.log("HTTP Method: ", event.context["http-method"]);
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? console.error("Unable to query. Error:", JSON.stringify(err, null, 2)) : JSON.stringify(res['Items']),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if(event.params.querystring.board_id == "undefined"){
        console.log("No board id provided");
        callback(null, {
            statusCode: 400,
            body: "Error: no board id provided",
            headers:{
                'Content-Type': 'application/json'
            }
        });
    }else{
        switch (event.context["http-method"]) {
            case 'GET':
                console.log("on get", event.params.querystring.TableName);
                console.log("Since: ", typeof (event.params.querystring.since))
                //metric is the partition key of the table; it represents the board id
                var params = {
                    TableName: event.params.querystring.TableName,
                    KeyConditionExpression: 'metric = :hkey and #ts > :sinceTimestamp',
                    ExpressionAttributeNames:{
                        "#ts": "timestamp"
                    },
                    ExpressionAttributeValues: {
                        ':hkey': event.params.querystring.board_id,
                        ':sinceTimestamp': parseInt(event.params.querystring.since)
                    }
                };
    
                dynamo.query(params, done);
    
                break;
            default:
                done(new Error(`Unsupported method "${event.httpMethod}"`));
        }
    }
};
