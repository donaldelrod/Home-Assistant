export class TPLinkDevice {
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
    sysinfo: string;
    mac: string;
    swVersion: string;
    hwVersion: string;
    tpid: string;
    tpname: string;
    tpmomdel: string;
    tptype: string;
    oemid: string;
    alais: string;
    supportsDimmer: boolean;
}



/*
manufacturer?: string;
    model?: string;
    harmony?:   [
        {
            name: string;
            controls: [
                {
                    name: string;
                    command: string;
                    formattedCommand: string;
                }
            ]
        }
    ];
    harmonyControl?: boolean;
    hueControl?: boolean;
    hue?: {
        capabilities: {
            certified: boolean;
            control: {
                mindimlevel: number;
                maxLumen: number;
                colorgamuttype?: string;
                colorgamut?: [
                    [ number, number ]
                ],
                ct?: {
                    min: number;
                    max: number;
                }
            };
            streaming: {
                renderer: boolean;
                proxy: boolean;
            };
        };
        config: {
            archetype: string;
            function: string;
            direction: string;
            startup: {
                mode: string;
                configured: boolean;
            }
        };
        uid: string;
        swversion: string;
        state: {
            on: boolean;
            bri: number;
            hue?: number;
            sat?: number;
            effect?: string;
            xy?: [number, number];
            ct?: number;
            colormode?: string;
            alert: string;
            mode: string;
            reachable: boolean;
        }
    };
}*/