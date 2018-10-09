# Azure IoT Edge Node-Red Module
<p>The Azure IoT Edge Node-Red Module is a module that can be deployed to Azure IoT Edge for prototyping and testing purposes. This module is provided "as-is", without any guarantee. The module can be found on Docker Hub [https://hub.docker.com/r/gbbiotwesouth/noderededgemodule/] and the source code can be found in the noderedmodule directory. If you want to create your own Node-Red module, just follow the steps that can be found in our documentation to create a Node.js IoT Edge module [https://docs.microsoft.com/en-us/azure/iot-edge/tutorial-node-module] and use the Node.js code provided in this repository.</p>
<p style="align:center">
<img src="images/screenshot.PNG">
</p>

## How to deploy the module
<p>The module is available as an AMD64 or ARM32 module. To run the module, deploy an IoT Edge on Linux [https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-linux] or Raspberry Pi [https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-linux-arm], and then deploy the respective module (AMD64 or ARM32V7):

<ol>
<li>In the Azure portal, navigate to your IoT hub.</li>
<li>Go to <strong>IoT Edge</strong> and select your IoT Edge device.</li>
<li>Select <strong>Set Modules</strong>.</li>
<li>In the <strong>Deployment Modules</strong> section of the page, click <strong>Add</strong> then select <strong>IoT Edge Module</strong>.</li>
<li>In the <strong>Name</strong> field, enter <code>nodered</code>. </li>
<li>In the <strong>Image URI</strong> field, enter <code>gbbiotwesouth/noderededgemodule:0.5.0-amd64</code> or <code>gbbiotwesouth/noderededgemodule:0.5.0-arm32v7</code>. </li>
<li><p>Set the Container Create Options and select <strong>Save</strong>.</p>
    <pre><code class="lang-json">{
  "HostConfig": {
    "Privileged": true,
    "PortBindings": {
      "1880/tcp": [
        {
          "HostPort": "1880"
        }
      ]
    }
  }
}</code></pre>
If you want to use physical inputs and outputs on your device (f.i. GPIO on Raspberry Pi) you need to make sure these physical devices are exposed to the module as part of the configuration options. In the create options we've set "Privileged" to true, giving you access to all underlying hardware devices.
</li>
<li><strong>NB:</strong> If you are deploying to a Raspberry Pi please ensure that you set the edgeHub environment variable "OptimizeForPerformance" to "false". See [https://docs.microsoft.com/en-us/azure/iot-edge/troubleshoot#stability-issues-on-resource-constrained-devices] for more information</li>
<li><p>Back in the <strong>Add modules</strong> step, select <strong>Next</strong>.</p>
</li>
<li><p>In the <strong>Specify routes</strong> step, you should have a default route that sends all messages from all modules to IoT Hub. If not, add the following code then select <strong>Next</strong>.</p>
<pre><code class="lang-json">{
    &quot;routes&quot;: {
        &quot;route&quot;: &quot;FROM /messages/* INTO $upstream&quot;
    }
}
</code></pre></li>
<li><p>In the <strong>Review Deployment</strong> step, select <strong>Submit</strong>.</p>
</li>
<li><p>Return to the device details page and select <strong>Refresh</strong>. In addition to the edgeAgent module that was created when you first started the service, you should see another runtime module called <strong>edgeHub</strong> and the <strong>tempSensor</strong> module listed. </p>
</li>
</ol>

Once the module is running you can access Node-Red through the browser on the same network as the edge device using the IP address or network name and port number 1880: http://&#x3C;edge-device-ip&#x3E;:1880

If you want to simulate a device sending data on the IoT Edge you can deploy the tempSensor module. For more information on how to do this please check out: https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-linux-arm.

An example of a route that can be used to validate sending input to the Node-Red module:
<pre><code>{
  "routes": {
    "routeToHub": "FROM /messages/modules/{noderedmodule}/outputs/* INTO $upstream",
    "tempToRed": "FROM /messages/modules/tempSensor/* INTO BrokeredEndpoint(\"/modules/{noderedmodule}/inputs/input1\")"
  }
}
</code></pre>

## Module nodes
The Node-Red module contains a number of custom nodes placed in the group "Azure IoT Edge". These nodes are "Module Twin", "Module Input", "Module Output", and "Module Method". These nodes represent the interaction that can be done with an Azure IoT Edge Module:
<ol>
<li><strong>Module Client:</strong><br/>
The Module Client is a configuration node that needs to be created to make the connection between the IoT Edge and the Node-Red Azure IoT Edge nodes. If you use one of the examples a Module Client will be created automatically.<br/>
<I><strong>NB:</strong> Only one Module Client node should be used when using the Node-Red module.</I>
</li>
<li><strong>Module Twin:</strong><br/>
The Module Twin enables you to interact with the module twin on IoT Hub. The node output will provide the twin desired property changes and the node input will enable you to send reported properties back to the IoT Hub. The message coming from the node output will have the property "topic: desired" added to it for selection and identification purposes.<br/>
The Module Twin only needs a connection to a Module Client: 
<div><img style="align:left;float:none" src="images/edit-module-twin.PNG"/></div>
</li>
<li><strong>Module Input:</strong><br/>
The Module Input enables you to receive input from other modules on your IoT Edge device. To receive input, you have to setup the route to point at the input you specified when you created the node. The node output will provide you with the incoming telemetry message. The message coming from the node output will have the properties "topic: input" and "input: &#x3C;input name&#x3E;" added to it for selection and identification purposes.<br/>
The Module Input needs a connection to a Module Client and the name of the "input": 
<div><img style="align:left;float:none" src="images/edit-module-input.PNG"/></div>
</li>
<li><strong>Module Output:</strong><br/>
The Module Output enables you to send output to the edgeHub. To send output to another module or to the IoT Hub you have to setup the route to use the output when you created the node. The node input will enable you to send the telemetry message. <br/>
The Module Output needs a connection to a Module Client and the name of the "output": 
<div><img style="align:left;float:none" src="images/edit-module-output.PNG"/></div>
</li>
<li><strong>Module Method:</strong><br/>
The Module Method enables you receive module direct methods. The setup of the module defines which method the node is responding to and what the response is for the method call. The message coming from the node output will have the properties "topic: method", "method: &#x3C;method name&#x3E;" and "payload: &#x3C;method payload&#x3E;" added to it for selection and identification purposes.<br/>
The input of the node will have to be used to send a response for the method call. The response (message) wil have to be connected (indirectly) to the message coming from the node output, to ensure a closed loop for the method. When sending a return for the method call on the input, the message property "status: &#x3C;your status&#x3E;" needs to be set on the message. See the function in the example for details.<br/>
The Module Method needs a connection to a Module Client and the name of the "method": 
<div><img style="align:left;float:none" src="images/edit-module-method.PNG"/></div>
</li>
</ol>

## How to use the module
<ol>
<li>Access the Node-Red module using a browser on the same network as the IoT Edge device: <br/>http://&#x3C;edge-device-ip&#x3E;:1880</li>
<li>Open one of the examples as a starter. For instance the full example, containing all custom nodes: <code>Import > Examples > azure iot-edge > full-example</code></li>
<li>Deploy the example and see the output either in the debug window of Node-Red or using device explorer on windows for the output messages send to IoT Hub.</li>
<li>If you want to deploy more output, input or method nodes you can drag these onto the Node-Red design service and connect them to the Module Client using the existing one as the configuration node in the node settings.</li>
<li>You can deploy any other Node-Red node if needed and interact with them, but remember you are running in a container and communication with serial ports, etc. might require additional setup of the container host [Moby].</li>
<li>My assumption is you know how to work with Node-Red, but if you don't you can find Node-Red's documentation here: [https://nodered.org/docs/user-guide/]</li>
</ol>

## Examples
The module comes with a number of examples within Node-Red:
<div><code>Import > Examples > azure iot-edge > full-example</code><br/>
<img style="align:left;float:none" src="images/full-example.PNG"/></div>
<div><code>Import > Examples > azure iot-edge > twin-example</code><br/>
<img style="align:left;float:none" src="images/twin-example.PNG"/></div>
<div><code>Import > Examples > azure iot-edge > input-example</code><br/>
<img style="align:left;float:none" src="images/input-example.PNG"/></div>
<div><code>Import > Examples > azure iot-edge > output-example</code><br/>
<img style="align:left;float:none" src="images/output-example.PNG"/></div>
<div><code>Import > Examples > azure iot-edge > method-example</code><br/>
<img style="align:left;float:none" src="images/method-example.PNG"/></div>