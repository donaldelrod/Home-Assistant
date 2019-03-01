import { Device } from './Device';
import * as harmony_tools from './harmony_tools';

class Control {
    name: string;
    command: string;
    formattedCommand: string;
}

class ControlGroup {
    name: string;
    controls: Control[];
}

export class HarmonyDevice extends Device {

    controlGroups: ControlGroup[];
    manufacturer: string;
    harmonyProfile: string;
    deviceModel: string;
    isManualPower: boolean;
    belongsToHub: string;
    hubInd: number;

    constructor(d:Device, cg:ControlGroup[], man:string, haProf:string, devMod:string, isManPow:boolean, hub:string, hubInd:number) {
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

        this.controlGroups = cg;
        this.manufacturer = man;
        this.harmonyProfile = haProf;
        this.deviceModel = devMod;
        this.isManualPower = isManPow;
        this.belongsToHub = hub;
        this.hubInd = hubInd;
    }

    sendCommand(formattedCommand): boolean {
        //harmony_tools.sendHarmonyCommand()
        console.log(formattedCommand);
        return false;
    }

}