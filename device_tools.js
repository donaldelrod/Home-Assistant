module.exports = {
    setDeviceState: function(device, state) {
        var toggle = state === undefined;

        if (toggle) {
            var power_state;
            if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb') {
                power_state = !device.obj.relayState
                device.obj.setPowerState(power_state);
            }
            return power_state;
        }

        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb') {
            device.obj.setPowerState(state);
            return state;
        }
    },
    turnOnDevice: function(device) {
        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
            device.obj.setPowerState(true);
    },
    turnOffDevice: function(device) {
        if (device.deviceKind == 'tplink-plug' || device.deviceKind == 'tplink-bulb')
            device.obj.setPowerState(false);
    }

};