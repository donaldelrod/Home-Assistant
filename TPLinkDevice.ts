import { Device } from './Device';
import { Client as TPBaseClient } from 'tplink-smarthome-api';

const TPClient      = new TPBaseClient();

export class TPLinkDevice extends Device {

    tplink:     any;
    sysinfo:    any;
    mac:        string;
    model:      string;
    swVersion:  string;
    hwVersion:  string;

    tpid:       number;
    tpname:     string;
    tpmodel:    string;
    tpdesc:     string;
    tptype:     string;

    supportsDimmer: boolean;


    constructor(d:Device, options:Object) {
        super(
            d.deviceID, 
            d.name, 
            d.deviceType, 
            d.deviceKind, 
            d.proto, 
            d.groups, 
            d.lastState, 
            d.isToggle, 
            d.lastStateString
        );
        
        if (d.deviceKind === 'tplink-bulb') {
            this.tplink = TPClient.getBulb(options);
        } else if (d.deviceKind === 'tplink-plug') {
            this.tplink = TPClient.getPlug(options);
        }



    }

    setState(newState:boolean): TPLinkDevice {
        let power_state:boolean;
        if (newState === undefined)
            power_state = !this.tplink.relayState;
        else 
            power_state = newState;
        
        this.tplink.setPowerState(power_state);
        this.lastState = power_state;
        return this;
    }
}