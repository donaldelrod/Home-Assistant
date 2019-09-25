export class Device {
    deviceID: number;
    name: string;
    deviceType: string;
    deviceKind: string;
    deviceProto: string;
    groups: string[];
    lastState: boolean;
    isToggle: boolean;
    lastStateString: string;
    ip: string;
    unavailable: boolean;
    harmony?: any;
    harmonyControl?: any;
}
    