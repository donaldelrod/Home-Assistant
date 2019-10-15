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


## Partially Supported Devices
  * Hue Devices (via Hue Hub, currently lacking color and brightness controls on both front and back end)
  * Harmony Devices (via Harmony Hub, can control all devices via backend but does not support control from frontend currently other than powering on and off devices)
  
## Planned Device Support
  * Smart Life products
  * Zigbee/Z-Wave devices
  * Nest
  * Ring

## Currently Supported Modules
  * none because I am trying to figure out modular modules :)

## Partially Supported Modules
  * Google Calendar and Gmail (kinda works, currently works via legacy module loading / hard coded support)
  * Proxmox hypervisor monitor (again supported via legacy module loading and not built out as much as it needs to be)

## Planned Module Support
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
  * setup(devices) *optional, but this function is called on all new devices at runtime to help set up the device

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
            "file" : "./Devices/TPLinkDevice.js"
        },
        {
            "deviceType": "HarmonyHubDevice",
            "file": "./Devices/HarmonyHubDevice.js"
        }
]
```
This allows the server to find the modules, load them at runtime, and extend the utility of the server without modifying core code.


## Future Goals

  * Android App
  * iOS App
  * Desktop App (via Electron, shouldn't be too hard)
  * Habit analysis and machine learning of users (but of course you will be totally in control of data gleaned from analysis, I'm not trying to steal your data cuz a. that's mega creepy and b. I'm out here doing my own thing, I don't care when you turn off your lights on Mondays)