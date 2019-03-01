export class Device {
    deviceID: number;
    name: string;
    deviceType: string;
    deviceKind: string;
    proto: string;
    groups: string[];
    lastState: boolean;
    isToggle: boolean;
    lastStateString: string;

    unavailable: boolean;
    lastSeen: Date;

    // constructor(id:number, name:string) {
    //     this.deviceID = id;
    //     this.name = name;
    // }

    constructor(id:number, name:string, type:string, kind:string, proto:string, groups:string[], lastState:boolean, isTogg:boolean, lastStateStr:string) {
        this.deviceID = id;
        this.name = name;
        this.deviceType = type;
        this.deviceKind = kind;
        this.proto = proto;
        this.groups = groups;
        this.lastState = lastState;
        this.isToggle = isTogg;
        this.lastStateString = lastStateStr;

        this.unavailable = true;
    }
    
    getSendableDevice(d: any): Device {
        return new Device(d.deviceID, d.name,d.deviceType, d.deviceKind, d.deviceProto, d.groups, d.lastState, d.isToggle, d.lastState ? 'on' : 'off');
    };

    setState(newState: boolean): Device {
        this.lastState = newState;
        this.lastStateString = this.lastState ? 'on' : 'off';
        return this;
    }


}