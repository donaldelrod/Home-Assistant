export class Device {
    deviceID: number;
    name: string;
    deviceType: string;
    deviceKind: string;
    proto: string;
    groups: string[];
    lastState?: boolean;
    isToggle: boolean;
    manufacturer?: string;
    model?: string;
    lastStateString?: string;
}