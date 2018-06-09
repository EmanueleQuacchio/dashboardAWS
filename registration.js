//TODO: evaluate to set the aws config via a config file
AWS.config.update({
    region: 'eu-west-1'
});
// Initialize the Amazon Cognito credentials provider
var creds = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-1:f522a283-1d50-4682-b00d-299bc2407401'
});
AWS.config.credentials = creds;
var iot = new AWS.Iot({
    apiVersion: '2015-05-28'
});


function checkThing(userThingName, things) {
    try {
        console.log(things.things[0]);
        let flag = false;
        if (things.things.findIndex(thing => thing.thingName === userThingName) > -1) {
            alert('Thing already exists, redirect...');
            window.location.href = 'dashboard.html?thing=' + userThingName;
            return;
        } else {
            createNewThing(userThingName);
        }
    } catch (err) {
        console.log(err);
        alert("An error occurred, try to reload the page");
    }
}

function login(b_id) {

    b_id = b_id.toUpperCase();
    console.log("Login => board id: " + b_id);
    if (checkMACAddress(b_id)) {
        var params = {};
        try {
            iot.listThings(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    alert("An error occurred, try to reload the page");
                } else {
                    if (data.things.findIndex(thing => thing.thingName === b_id) > -1) {
                        window.location.href = 'dashboard.html?thing=' + b_id;
                        return;
                    } else {
                        alert("The board is not yet registered");
                    }
                } // successful response
            });
        } catch (err) {
            console.log(err);
        }
    }
}

function handleClick(thingName) {
    thingName = thingName.toUpperCase();
    if (checkMACAddress(thingName)) {
        console.log("Thing name inserted: " + thingName);
        var params = {};
        iot.listThings(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                checkThing(thingName, data);
            } // successful response
        });
    }
}

function createNewThing(thingName) {
    //create thing, get cert, attach cert, attach policy
    console.log("Create a new thing: ", thingName);
    var params = {
        thingName: thingName, //required 
        attributePayload: {
            attributes: {},
            merge: false //Specifies whether the list of attributes provided in the AttributePayload is merged with the attributes stored in the registry, instead of overwriting them
        }
    };

    iot.createThing(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } // an error occurred
        else {
            console.log(data);
            var params = {
			  //thingArn: 'STRING_VALUE',
			  thingGroupArn: 'arn:aws:iot:eu-west-1:139571899202:thinggroup/AWS_ST_things',
			  thingGroupName: 'AWS_ST_things',
			  thingName: thingName
			};
			iot.addThingToThingGroup(params, function(err, data) {
			  if (err) console.log(err, err.stack); // an error occurred
			  else     console.log(data);           // successful response
			});
            var certParams = {
                setAsActive: true
            };
            iot.createKeysAndCertificate(certParams, function(err, certData) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    //console.log(certData); // successful response
                    //console.log(certData.certificatePem.toString());
                    let certDataPlain = certData.certificatePem.toString() + certData.keyPair.PrivateKey.toString();
                    console.log(certDataPlain);

                    try {
                        var data = "text/plain;charset=utf-8," + encodeURIComponent(certDataPlain);
                        $('<h4>Certificate</h4> <a href="data:' + data + '" download="data.cert">download certificate and keys</a>').appendTo('#container');
                    } catch (err) {
                        console.log(err);
                    }
                    attachThingAndPolicy(thingName, certData.certificateArn);
                }
            });
        } // successful response
    });

}

function attachThingAndPolicy(thingName, certId) {
    try {
        console.log('attachThingAndPolicy');
        var params = {
            principal: certId,
            /* required */
            thingName: thingName /* required */
        };
        console.log(params);
        iot.attachThingPrincipal(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
        });

        var policyParams = {
            policyName: 'iot_policy',
            /* required */
            principal: certId /* required */
        };
        iot.attachPrincipalPolicy(policyParams, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
        });
    } catch (err) {
        console.log(err);
    }

}

function checkMACAddress(b_id) {
    var macAddress = b_id;
    var macAddressRegExp = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
    if (!(macAddress.includes("00:80:E1") || macAddress.includes("C4:7F:51"))){
        alert("Invalid MAC Address");
        return false;
    }else{
        if (macAddress.length != 17) {
            alert('Mac Address is not the proper length.');
            return false;
        }
        if (macAddressRegExp.test(macAddress) == false) { //if match failed
            alert("Please enter a valid MAC Address.");
            return false;
        }
        return true;
    }
}

function deleteThing(b_id) {
    var board_id = b_id.toUpperCase();
    var r = confirm("Press OK if you really want to delete the registered board");
    if (r == true) {
        console.log(board_id);
        var params = {
            thingName: board_id //required 
        };
        if(checkMACAddress(board_id)){
            iot.listThingPrincipals(params, function(err, data) {
                if (err){
                    console.log(err, err.stack); // an error occurred
                    alert("Board doesn't exist");
                }
                else {
                    // successful response
                    console.log(data.principals[0]);
                    var certARN = data.principals[0]
                    var PREFIX = "cert/";

                    var certID = certARN.slice(certARN.indexOf(PREFIX) + PREFIX.length);
                    console.log("ID to send: ", certARN);
                    var deactiveParams = {
                        certificateId: certID, //required
                        newStatus: "INACTIVE" //required
                    };
                    iot.updateCertificate(deactiveParams, function(err, data) {
                        if (err) {
                            console.log("Error trying to update ", err)
                            console.log(err, err.stack); // an error occurred
                        } else {
                            console.log(data); // successful response
                            //detach
                            var detachParams = {
                                principal: certARN,
                                /* required */
                                thingName: board_id /* required */
                            };
                            iot.detachThingPrincipal(detachParams, function(err, data) {
                                if (err)
                                    console.log(err, err.stack); // an error occurred
                                else {
                                    console.log(data);
                                    var certParams = {
                                        certificateId: certID, //required
                                        forceDelete: true
                                    };
                                    iot.deleteCertificate(certParams, function(err, data) {
                                        if (err)
                                            console.log(err, err.stack); // an error occurred
                                        else {
                                            console.log(data); // successful response
                                            var thingParams = {
                                                thingName: board_id
                                            }
                                            iot.deleteThing(thingParams, function(err, data) {
                                                if (err)
                                                    console.log(err, err.stack); // an error occurred
                                                else{
                                                    console.log(data); // successful response
                                                    alert("Board correctly deleted");
                                                }
                                            });
                                        }
                                    });
                                } // successful response
                            });

                        }
                    });
                }
            });
        }
    } else {
        console.log("You pressed Cancel!");
    }
}