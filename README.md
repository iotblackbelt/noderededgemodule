# Azure IoT Edge Node-Red Module
<p>The Azure IoT Edge Node-Red Module is a module that can be deployed to Azure IoT Edge for prototyping and testing purposes. The Module is provided "as-is", without any garantee. The module can be found on Docker Hub [https://hub.docker.com/r/gbbiotwesouth/noderededgemodule/].</p>

## How to deploy the module
<p>The module is available as a AMD64 or ARM  module. To run the module deploy an IoT Edge on Linux [https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-linux] or Raspberry Pi [https://docs.microsoft.com/en-us/azure/iot-edge/how-to-install-iot-edge-linux-arm], and then deploy the respective module (AMD64 or ARM32V7):

<ol>
<li>In the Azure portal, navigate to your IoT hub.</li>
<li>Go to <strong>IoT Edge</strong> and select your IoT Edge device.</li>
<li>Select <strong>Set Modules</strong>.</li>
<li>In the <strong>Deployment Modules</strong> section of the page, click <strong>Add</strong> then select <strong>IoT Edge Module</strong>.</li>
<li>In the <strong>Name</strong> field, enter <code>nodered</code>. </li>
<li>In the <strong>Image URI</strong> field, enter <code>gbbiotwesouth/noderededgemodule:0.4.0-amd64</code> or <code>gbbiotwesouth/noderededgemodule:0.4.0-arm32v7</code>. </li>
<li><p>Set the Container Create Options and select <strong>Save</strong>.</p>
    <pre><code class="lang-json">{
  "HostConfig": {
    "PortBindings": {
      "1880/tcp": [
        {
          "HostPort": "1880"
        }
      ]
    }
  }
}</code></pre>
</li>
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

Once the module is running you can access Node-Red through the browser on the same network as the edge device using the ip address or network name and port number 1880: http://&#x3C;edge-device-ip&#x3E;:1880

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
The Node-Red module contains a number of custom nodes placed in the group "Azure IoT Edge". These node are "Module Twin", "Module Input", "Module Output", and "Module Method". These node represent the interaction that can be done with an Azure IoT Edge Module:
<ol>
<li>Module Twin:
<ol><li>The Module Twin enables you to interact with the module twin on IoT Hub. The node output will provide the twin desired property changes and the node input will enable you to send reported propeties back to the IoT Hub.</li></ol>
</li>
<li>Module Input:
<ol><li>The Module Input enables you to receive input from other modules on your IoT Edge device. To receive input you have to setup the route to point at the input you specified when you created the node. The node output will provide you with the incoming telemetry message.</li></ol>
</li>
<li>Module Output:
<ol><li>The Module Output enables you to send output to the edgeHub. To send output to another module or to the IoT Hub you have to setup the route to use the output when you created the node. The node input will enable you to send the telemetry message.</li></ol>
</li>
<li>Module Method:
<ol><li>The Module Method enables you receive module direct methods. The setup of the module defines which method the node is responding to and what the response is for the method call. Currently the response is fixed in the node setup.</li></ol>
</li>
</ol>

## How to use the module
<ol>
<li>Access the Node-Red module using a browser on the same network as the IoT Edge device: <br/>http://&#x3C;edge-device-ip&#x3E;:1880</li>
<li>Open one of the examples as a starter. For instance the full example, containing all custom nodes: <code>Import > Examples > azure iot-edge > full-example</code></li>
<li>Deploy the example and see the output either in the debug window of Node-Red or using device explorer on windows for the output messages send to IoT Hub</li>
<li>If you want to deploy more output, input or method nodes you can drag these onto the Node-Red design service and conect them to the Module Client using the existing one as the configuration node in the node settings.</li>
</ol>
