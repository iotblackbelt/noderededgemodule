module.exports = function (RED) {
    'use strict'

    var Transport = require('azure-iot-device-mqtt').Mqtt;
    var Client = require('azure-iot-device').ModuleClient;
    var Message = require('azure-iot-device').Message;

    var statusEnum = {
        disconnected: { color: "red", text: "Disconnected" },
        connected: { color: "green", text: "Connected" },
        sent: { color: "blue", text: "Sending message" },
        received: { color: "yellow", text: "Receiving message" },
        reported: { color: "blue", text: "Sending reported properties" },
        desired: { color: "yellow", text: "Receiving desired properties" },
        method: { color: "yellow", text: "Receiving direct method" },
        response: { color: "blue", text: "Sending method response" },
        error: { color: "grey", text: "Error" }
    };

    var moduleClient;
    var moduleTwin;
    var methodResponses = [];

    // Function to create the Module Client 
    function ModuleClient(config) {
        // Store node for further use
        var node = this;
        node.connected = false;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);

        // Create the module client
        Client.fromEnvironment(Transport, function (err, client) {
            if (err) {
                node.log('Module Client creation error:' + err);
            }
            else {
                client.on('error', function (err) {
                    node.log('Module Client error:' + err);
                });
                node.log('Module Client created.');
                // connect to the Edge instance
                client.open(function (err) {
                    if (err) {
                        node.log('Module Client open error:' + err);
                        throw err;
                    } else {
                        node.log('Module Client connected.');
                        client.getTwin(function(err, twin) {
                            if (err) {
                                node.error('Could not get the module twin: ' + err);
                                throw err;
                            } else {
                                node.log('Module twin created.');
                                node.log('Twin contents:');
                                node.log(JSON.stringify(twin.properties));

                                node.on('close', function() {
                                    node.log('Azure IoT Edge Module Client closed.');
                                    moduleClient = null;
                                    moduleTwin = null;
                                    twin.removeAllListeners();
                                    client.removeAllListeners();
                                    client.close();
                                });
                                moduleTwin = twin;
                            }
                        });
                        moduleClient = client;
                    }
                });
            }
        });
    }

    // Function to create the Module Twin 
    function ModuleTwin(config) {
        // Store node for further use
        var node = this;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);  
        getClient().then(function(client){
            setStatus(node, statusEnum.connected);
            getTwin().then(function(twin){
                // Register for changes
                twin.on('properties.desired', function(delta) {
                    setStatus(node, statusEnum.desired);
                    node.log('New desired properties received:');
                    node.log(JSON.stringify(delta));
                    node.send({payload: delta, topic: "desired"})
                    setStatus(node, statusEnum.connected);
                });

                node.on('input', function (msg) {
                    setStatus(node, statusEnum.reported);
                    var messageJSON = null;
        
                    if (typeof (msg.payload) != "string") {
                        messageJSON = msg.payload;
                    } else {
                        //Converting string to JSON Object
                        messageJSON = JSON.parse(msg.payload);
                    }

                    twin.properties.reported.update(messageJSON, function(err) {
                        if (err) throw err;
                        node.log('Twin state reported.');
                        setStatus(node, statusEnum.connected);
                    });
                });
            })
            .catch(function(err){
                node.log('Module Twin error:' + err);
            });
        })
        .catch(function(err){
            node.log("Module Twin can't be loaded: " + err);
        });
                        
        node.on('close', function(done) {
            setStatus(node, statusEnum.disconnected);
            done();
        });
    }

    // Module input to receive input from edgeHub
    function ModuleInput(config) {
        // Store node for further use
        var node = this;
        node.input = config.input;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);
        getClient().then(function(client){
            setStatus(node, statusEnum.connected);
            // Act on module input messages
            node.log("Module Input created: " + node.input);
            client.on('inputMessage', function (inputName, msg) {
                outputMessage(client, node, inputName, msg);
            });
        })
        .catch(function(err){
            node.log("Module Input can't be loaded: " + err);
        });
       
        node.on('close', function(done) {
            setStatus(node, statusEnum.disconnected);
            done();
        });
    }

    // Module output to send output to edgeHub 
    function ModuleOutput(config) {
        // Store node for further use
        var node = this;
        node.output = config.output;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);
        getClient().then(function(client){
            setStatus(node, statusEnum.connected);
            // React on input from node-red
            node.log("Module Output created: " + node.output);
            node.on('input', function (msg) {
                setStatus(node, statusEnum.sent);
                var messageJSON = null;

                if (typeof (msg.payload) != "string") {
                    messageJSON = msg.payload;
                } else {
                    //Converting string to JSON Object
                    messageJSON = JSON.parse(msg.payload);
                }

                var messageOutput = node.output;
                sendMessageToEdgeHub(client, node, messageJSON, messageOutput);
            });
        })
        .catch(function(err){
            node.log("Module Ouput can't be loaded: " + err);
        });

        node.on('close', function(done) {
            setStatus(node, statusEnum.disconnected);
            done();
        });
    }

    // Module method to receive methods from IoT Hub 
    function ModuleMethod(config) {
        // Store node for further use
        var node = this;
        node.method = config.method;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);
        getClient().then(function(client){
            setStatus(node, statusEnum.connected);
            var mthd = node.method;
            node.log('Direct Method created: ' + mthd);
            client.onMethod(mthd, function(request, response) {
                // Set status
                setStatus(node, statusEnum.method);
                node.log('Direct Method called: ' + request.methodName);

                if(request.payload) {
                    node.log('Method Payload:' + JSON.stringify(request.payload));
                    node.send({payload: request.payload,topic: "method", method: request.methodName});
                }
                else {
                    node.send({payload: null,topic: "method", method: request.methodName});
                }

                getResponse(node).then(function(rspns){
                    var responseBody;
                    if (typeof (msg.payload) != "string") {
                        responseBody = rspns.response;
                    } else {
                        //Converting string to JSON Object
                        responseBody = JSON.parse(rspns.response);
                    }
                    response.send(rspns.status, responseBody, function(err) {
                        if (err) {
                        node.log('Failed sending method response: ' + err);
                        } else {
                        node.log('Successfully sent method response.');
                        }
                    });
                })
                .catch(function(err){
                    node.log("Failed sending method response: response not received.");
                });
                // reset response
                node.response = null;

                setStatus(node, statusEnum.connected);
            }); 
            
            // Set method response on input
            node.on('input', function (msg) {
                var method = node.method;
                methodResponses.push(
                    {method: method, response: msg.payload, status: msg.status}
                );
                node.log("Module Method response set through node input: " + JSON.stringify(methodResponses.find(function(m){return m.method === method}))); 
            });
        })
        .catch(function(err){
            node.log("Module Method can't be loaded: " + err);
        });

        node.on('close', function(done) {
            setStatus(node, statusEnum.disconnected);
            done();
        });
    }

    // Get module client using promise, and retry, and slow backoff
    function getClient(){
        var retries = 20;
        var timeOut = 1000;
        // Retrieve client using progressive promise to wait for module client to be opened
        var promise = Promise.reject();
        for(var i=1; i <= retries; i++) {
            promise = promise.catch( function(){
                    if (moduleClient){
                        return moduleClient;
                    }
                    else {
                        throw new Error("Module Client not initiated..");
                    }
                })
                .catch(function rejectDelay(reason) {
                    retries++;
                    return new Promise(function(resolve, reject) {
                        setTimeout(reject.bind(null, reason), timeOut * ((retries % 10) + 1));
                    });
                });
        }
        return promise;
    }

    function getTwin(){
        var retries = 10;
        var timeOut = 1000;
        // Retrieve twin using progressive promise to wait for module twin to be opened
        var promise = Promise.reject();
        for(var i=1; i <= retries; i++) {
            promise = promise.catch( function(){
                    if (moduleTwin){
                        return moduleTwin;
                    }
                    else {
                        throw new Error("Module Client not initiated..");
                    }
                })
                .catch(function rejectDelay(reason) {
                    return new Promise(function(resolve, reject) {
                        setTimeout(reject.bind(null, reason), timeOut * i);
                });
            });
        }
        return promise;
    }

    // Get module method response using promise, and retry, and slow backoff
    function getResponse(node){
        var retries = 20;
        var timeOut = 1000;
        var m = {};
        node.log("Module Method node method: " + node.method);
        // Retrieve client using progressive promise to wait for module client to be opened
        var promise = Promise.reject();
        for(var i=1; i <= retries; i++) {
            promise = promise.catch( function(){
                    var methodResponse = methodResponses.find(function(m){return m.method === node.method});
                    if (methodResponse){
                        // get the response and clean the array
                        var response = methodResponse;
                        node.log("Module Method response object found: " + JSON.stringify(response));
                        methodResponses.splice(methodResponses.findIndex(function(m){return m.method === node.method}),1);
                        return response;
                    }
                    else {
                        throw new Error("Module Method Response not initiated..");
                    }
                })
                .catch(function rejectDelay(reason) {
                    retries++;
                    return new Promise(function(resolve, reject) {
                        setTimeout(reject.bind(null, reason), timeOut * ((retries % 10) + 1));
                    });
                });
        }
        return promise;
    }

    // This function just sends the incoming message to the node output adding the topic "input" and the input name.
    var outputMessage = function(client, node, inputName, msg) {

        client.complete(msg, function (err) {
            if (err) {
                node.log('error:' + err);
                setStatus(node, statusEnum.error);
            }
        });

        if (inputName === node.input){
            setStatus(node, statusEnum.received);
            var message = JSON.parse(msg.getBytes().toString('utf8'));
            if (message) {
                node.log('Processed input message:' + inputName)
                // send to node output
                node.send({payload: message, topic: "input", input: inputName});
            }
            setStatus(node, statusEnum.connected);
        }   
    }

    var setStatus = function (node, status) {
        node.status({ fill: status.color, shape: "dot", text: status.text });
    }

    var sendMessageToEdgeHub = function (client, node, message, output) {

        // Send the message to IoT Edge
        if (!output)
        {
            output = "output";
        }
        node.log('Sending Message to Azure IoT Edge: ' + output + '\n   Payload: ' + JSON.stringify(message));
        var msg = new Message(JSON.stringify(message));
        client.sendOutputEvent(output, msg, function (err, res) {
            if (err) {
                node.error('Error while trying to send message:' + err.toString());
                setStatus(node, statusEnum.error);
            } else {
                node.log('Message sent.');
                setStatus(node, statusEnum.connected);
            }
        });
    }

    // Registration of the client into Node-RED
    RED.nodes.registerType("moduleclient", ModuleClient, {
        defaults: {
            module: {value: ""}
        }
    });
    
    // Registration of the node into Node-RED
    RED.nodes.registerType("moduletwin", ModuleTwin, {
        defaults: {
            name: { value: "Module Twin" }
        }
    });

    // Registration of the node into Node-RED
    RED.nodes.registerType("moduleinput", ModuleInput, {
        defaults: {
            input: { value: "input1"}
        }
    });

    // Registration of the node into Node-RED
    RED.nodes.registerType("moduleoutput", ModuleOutput, {
        defaults: {
             output: { value: "output1"}
        }
    });

    // Registration of the node into Node-RED
    RED.nodes.registerType("modulemethod", ModuleMethod, {
        defaults: {
            method: { value: "method1"},
            response: { value: "{}"}
        }
    });

}
