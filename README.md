# Azure IoT Edge Node-Red Module
<p>The Azure IoT Edge Node-Red Module is a module that can be deployed to Azure IoT Edge for prototyping and testing purposes. The Module is provided as is without any garantee. The module can be found on Docker Hub [https://hub.docker.com/r/gbbiotwesouth/noderededgemodule/].</p>

## How to deploy the module
<p>To use it deploy an IoT Edge on Linux [] or Raspberry Pi [], and then deploy the respective module (AMD64 or ARM32V7):

<ol>
<li>In the Azure portal, navigate to your IoT hub.</li>
<li>Go to <strong>IoT Edge</strong> and select your IoT Edge device.</li>
<li>Select <strong>Set Modules</strong>.</li>
<li>In the <strong>Deployment Modules</strong> section of the page, click <strong>Add</strong> then select <strong>IoT Edge Module</strong>.</li>
<li>In the <strong>Name</strong> field, enter <code>tempSensor</code>. </li>
<li>In the <strong>Image URI</strong> field, enter <code>mcr.microsoft.com/azureiotedge-simulated-temperature-sensor:1.0</code>. </li>
<li><p>Set the Container Create Options and select <strong>Save</strong>.</p>
<p><img src="../includes/media/iot-edge-deploy-module/name-image.png" alt="Save IoT Edge module after entering name and image URI" data-linktype="relative-path"></p>
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
<p><img src="../includes/media/iot-edge-deploy-module/deployed-modules.png" alt="View tempSensor in list of deployed modules" data-linktype="relative-path"></p>
</li>
</ol>

You need to deploy the node-red module using the following Container Create Options:
{
  "HostConfig": {
    "PortBindings": {
      "1880/tcp": [
        {
          "HostPort": "1880"
        }
      ]
    }
  }
}

Once the module is running you can access node-red through the browser on the same network as the edge device using:
http://<edge-device-ip>:1880
