# Azure IoT Edge Node-RED nodes

This package contains the Node-RED nodes that can be deployed to a Node-RED container running as an Azure IoT Edge module. These nodes enable you to interact with the IoT Edge platform using Node-RED. They will only work if the nodes are installed on a IoT Edge module running Node-RED. The nodes are also available as a precreated module for Azure IoT Edge. For more information on how to use the nodes, checkout the [Node-RED Edge Module Github repository](https://github.com/iotblackbelt/noderededgemodule). 

## Install the node using npm
Run command in Node-RED installation directory.

```
npm install node-red-contrib-azure-iot-edge-module
```

or run command for global installation.

```
npm install -g node-red-contrib-azure-iot-edge-module
```

## Install the node using palette manager in Node-RED
1. Open the palette manager in Node-RED
1. Click the **Install** tab
1. Search for **node-red-contrib-azure-iot-edge-module**
1. Clcik the **Install** button next to the node

## Add the installation of the node to a docker container build
Create a docker build file using the desired node container as the base container and add the following statements:

```
WORKDIR <node-red installation directory in your container>/node_modules/
RUN npm install node-red-contrib-azure-iot-edge-module
```
> Replace **<node-red installation directory in your container>** by the directory that was used to install Node-RED in the container.

