module.exports = {
    setDeviceState: function(device, state) {
        var toggle = state === undefined;

        if (toggle) {
            if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
                device.setPowerState(!device.relayState);
            return;
        } 

        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
            device.setPowerState(state);
    },
    turnOnDevice: function(device) {
        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
            device.setPowerState(true);
    },
    turnOffDevice: function(device) {
        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
            device.setPowerState(false);
    }

};