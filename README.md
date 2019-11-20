# Home-Assistant JS
Raspberry Pi Home Automation Server

This project's goal is to be a complete solution to personal home automation needs. Currently under heavy development and refactoring, right now the platform supports modular device addons for vendor-specific home automation protocols, with support coming for modular frontend Angular 7 components, modules for the core server runtime, and activities/automations.

## Setup
### Requirements:
  * Node v11.0.0
  * Angular 7
  * npm

Once all of these are installed, simply clone this repository and cd into the directory. Run the command `npm install` and allow the required packages to download. After this has finished, cd into the ./angular directory and run `npm install` again, allowing the angular dependencies to download. Finally, cd back into the root directory and run `gulp build` to have the frontend minified and compiled, and the backend minified and packaged for production. The an `npm start` or `node .` will start the server, and navigating to `http://localhost:9875/` will launch the front end. The server and API documentation is also hosted by the backend, and is located at 

`http://localhost:9875/docs/server`

`http://localhost:9875/docs/api`


## Currently Supported Devices
  * TP-Link Kasa Bulbs and Plugs
  * Tuya Devices
  * Netgear routers
  * Hue Lights (via a hub, and only on and off for now, I need to figure out how to dynamically load HTML content to the Angular frontend in order to add additional controls)
  * Harmony Hubs (currently, devices can be turned on and off but like above, the frontend component needs to be figured out before additional support is added)


## Partially Supported Devices
  * Hue Devices (via Hue Hub, currently lacking color and brightness controls on both front and back end)
  * Harmony Devices (via Harmony Hub, can control all devices via backend but does not support control from frontend currently other than powering on and off devices)
  
## Planned Device Support
  * Smart Life products
  * Zigbee/Z-Wave devices
  * Nest
  * Ring

## Currently Supported Plugins
  * none because I am trying to figure out modular plugins :)

## Partially Supported Plugins
  * Google Calendar and Gmail (kinda works, currently works via legacy module loading / hard coded support)
  * Proxmox hypervisor monitor (again supported via legacy module loading and not built out as much as it needs to be)

## Planned Plugin Support
  * Google Assistant integration
  * Alexa integration
  * Cortana integration
  * Homekit integration
  * UPS/USPS/FedEx tracking


## How to create device modules
Device modules are loaded at server runtime, and must implement a number of common functions defined in the Device.js file in the ./Devices folder. These common functions include:
  * constructor(Device, device_specific_options)
  * setState(newState)
  * toggleState()
  * getSendableDevice()
  * setup(devices) *optional, but this function is called on all new devices at runtime to help set up the device. This is where any async calls to device APIs should be made, and where additional devices can be setup and added to the device array if the device being added is a hub of some sort

Some devices are controlled by a 'hub', such as Harmony devices or Hue devices. Currently (or personally, there are different approaches that can be taken here), I have created a device module for the hub as well as the devices that the hub controls, and allow for a "setup()" function that will allow the hub device to create additional devices and add them to the main device array. This works nicely, but currently makes it difficult to use devices not directly controllable by the program (they are dynamically created when the server starts, and are not saved, so automations built with them might break if the server restarts).

## Device Module files
In order to load a device module at runtime, there are a number of files that need to be created. Eventually, I want to make a simple CLI to generate the base files for the plugins, but for now I am just going to list them
  * Devices
    * Devicename.js
  * routes
    * devicename.js (optional, only needed if additional API endpoints are used for integrating the device)

In addition to these files, the device module must be added to the ./config/config.json file, as the following:
```json
"deviceModules" : [
  {
    "deviceType": "TPLinkDevice",
    "file" : "./Devices/TPLinkDevice.js",
    "devices": [
      {
        "name": "Light",
        "deviceID": 0,
        "deviceProto": "TPLinkDevice",
        "deviceKind": "TPLink Plug",
        "deviceType": "Wifi Plug",
        "ip": "192.168.1.x",
        "pollable": true,
        "groups": [
          "bedroom",
          "lights",
          "plugs"
        ],
        "isToggle": true,
        "roomID": 1,
        "roomName": "Bedroom"
      }
    ]
  },
  {
    "deviceType": "HarmonyHubDevice",
    "file": "./Devices/HarmonyHubDevice.js",
    "devices": [
      {
        "name": "Living Room Harmony Hub",
        "deviceID": 3,
        "deviceProto": "HarmonyHubDevice",
        "deviceKind": "Harmony Controller",
        "deviceType": "Controller",
        "ip": "192.168.1.x",
        "pollable": false,
        "groups": [
          "control",
          "ir"
        ],
        "isToggle": false,
        "roomID": 2,
        "roomName": "Living Room"
      }
    ]
  }
]
```
This allows the server to find the device modules, load them at runtime, and extend the utility of the server without modifying core code. At the moment, these need to be created manually, but once the design is finalized I will be creating a tool in the frontend to input this information, and the configurations will be able to be created from the frontend

## Plugins
Plugins allow additional functionality to be injected into the main server, and can service a number of goals. In order for them to work, they must extend the Plugin class. Currently I am implementing a presence detection function, which allows the Profiles to actually be useful. Presently, the plugins must implement the following function for basic functionality:

  * setup()

This allows the plugin to run any code necessary to set it up, such as scheduling functions to run periodically, connecting to external services, or anything else necessary for the plugin to function.

The following functions can be used to integrate into functionality already in the server

  * getPresence() - this allows for the plugin to return a list of devices it can see in order to give a more accurate guess on whether someone is home or not


## Plugin Files
In order for plugins to work, they must be in the Plugins folder and entires for them must be made in the config/config.json file. Below is an example of how this works:

```json
"plugins": [
  {
    "pluginName": "NetgearModule",
    "pluginFile": "./Plugins/NetgearModule.js",
    "activated": true,
    "details": {
      "username": "username",
      "password": "password",
      "host": "192.168.1.x",
      "port": "5000"
    }
  }
]
```

This allows the server to find the plugins, load them at runtime, and gives the user a way to specify any necessary information for the plugin to run properly, such as login passwords or secret keys, IP addresses, etc.

## Profiles
Profiles are basically just a list of people that live at the house, with information about them, such as identifiers to tell whether they are at the house or not. I intend to eventually implement a profile-based login for Home Assistant, allowing for devices to be "assigned" to users so roommates can't turn off your TV from the other room or mess with you lights, however basic functionality is more of a priority for me at the moment so this will come some time down the road.

Profiles are stored in the profiles.json file in the config folder, and are formatted in the following way:

```json
[
  {
    "person": "Donald",
    "devices": [],
    "strength": 0,
    "identifiers": {
      "ip": [
        "192.168.1.x1",
        "192.168.1.x2"
      ],
      "bt": []
    }
  }
]
```
The devices array is populated via the above mentioned presence detection functionality, and allows the frontend to display which of the devices are connected, so you can personally verify if the person is home (let's say you add the IP address of their computer and phone, but they leave their computer at home often. It might show there's a 50% chance they're home, but you know that seeing their phone connected has a much higher liklihood of them being there than their computer). The identifiers are where the magic happens, allowing you to input any sort of identifier, as long as there is a plugin that can process it. All of these identifiers are required to be arrays (even with only one value), otherwise they will not be processed. This simplifies the process of modularizing this process, so you can love it or leave it but thats how it works. The strength field is how many devices are detected, and is divided by the number of identifiers to give a liklihood that a person is home.

## Future Goals

  * Android App
  * iOS App
  * Desktop App (via Electron, shouldn't be too hard)
  * Habit analysis and machine learning of users (but of course you will be totally in control of data gleaned from analysis, I'm not trying to steal your data cuz a. that's mega creepy and b. I'm out here doing my own thing, I don't care what time you turn off your lights on Mondays unless you live at my house and it affects my electricity bill)