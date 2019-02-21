export class Profile {
    person: string;
    strength: number;
    devices: [
        {
            IP: string;
            Name: string;
            MAC: string;
            ConnectionType: string;
            Linkspeed: number;
            SignalStrength: number;
            AllowOrBlock: string;
        }
    ];
    identifiers: {
        ip: [
            string
        ];
        bt: [
            string
        ];
        "webhook-ifttt"?: string;
    }
}