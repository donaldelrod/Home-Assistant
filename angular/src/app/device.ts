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
}