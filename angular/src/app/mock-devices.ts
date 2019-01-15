import { Device } from './device';

export const DEVICES: Device[] = [
    {
        "name": "Bedroom Lamp",
        "deviceType": "Wifi Plug -> Light",
        "deviceKind": "tplink-plug",
        "proto": "tplink",
        "groups": [
        "bedroom",
        "lights",
        "plugs"
        ],
        "deviceID": 0,
        "lastState": false,
        "isToggle": true
        },
        {
        "name": "PS2 Sign",
        "deviceType": "Wifi Plug -> Light",
        "deviceKind": "tplink-plug",
        "proto": "tplink",
        "groups": [
        "bedroom",
        "lights",
        "plugs"
        ],
        "deviceID": 1,
        "lastState": false,
        "isToggle": true
        },
        {
        "name": "Bedroom Lights",
        "deviceType": "Wifi Switch -> Light",
        "deviceKind": "tuyapi-switch",
        "proto": "tuyapi",
        "groups": [
        "bedroom",
        "lights",
        "switches"
        ],
        "deviceID": 2,
        "lastState": false,
        "isToggle": true
        },
        {
        "name": "Bedroom PS4",
        "deviceKind": "harmony-GameConsoleWithDvd",
        "deviceType": "gameconsole",
        "proto": "harmony",
        "groups": [],
        "deviceID": 3,
        "lastState": undefined,
        "isToggle": false
        },
        {
        "name": "Bedroom Amp",
        "deviceKind": "harmony-Amplifier",
        "deviceType": "speaker",
        "proto": "harmony",
        "groups": [],
        "deviceID": 4,
        "lastState": true,
        "isToggle": false
        },
        {
        "name": "Bedroom TV",
        "deviceKind": "harmony-Television",
        "deviceType": "tv",
        "proto": "harmony",
        "groups": [],
        "deviceID": 5,
        "lastState": undefined,
        "isToggle": false
        },
        {
        "name": "Downstairs Toshiba TV",
        "deviceKind": "harmony-Television",
        "deviceType": "tv",
        "proto": "harmony",
        "groups": [],
        "deviceID": 6,
        "lastState": undefined,
        "isToggle": false
        }
]