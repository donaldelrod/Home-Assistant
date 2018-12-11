module.exports = {
    sendHarmonyCommand: function(modules, formattedCommand) {
        modules.harmony.hub.send('holdAction', 'action=' + formattedCommand + ':status=press');
    },
    setDeviceState: function(device, state, modules) {
        var toggle = state === undefined;
        var power_state;
        if (toggle) {
            if (device.deviceProto === 'tplink') {
                power_state = !device.obj.relayState
                device.obj.setPowerState(power_state);
                device.lastState = power_state;
            } else if (device.deviceProto === 'tuyapi') {
                device.obj.get().then(status => {
                    power_state = !status;
                    device.obj.set({set: !status}).then(result => {
                        if (result)
                            console.log('status change succeeded');
                        else console.log('status change failed');
                        device.lastState = !status;
                    });
                }).catch(err => console.log(err));
            } else if (device.deviceProto === 'harmony') {
                var powerControl = this.getHarmonyControl(modules, device.name, 'Power', 'PowerToggle');
                this.sendHarmonyCommand(modules, powerControl.formattedCommand);
                device.lastState = device.lastState === undefined ? undefined : !device.lastState;
            }
            return power_state;
        }
        //if we are not toggling the power and instead setting the state directly
        if (device.deviceProto === 'tplink') {
            device.obj.setPowerState(state);
            power_state = state;
            device.lastState = state;
        } else if (device.deviceProto === 'tuyapi') {
            device.obj.set({set: state}).then(result => {
                power_state = state;
                if (result) {
                    console.log('successfully set state to true');
                    device.lastState = state;
                }
                else console.log('failed to set state to true');
            }).catch(err => console.log(err));
            
        }
        else if (device.deviceProto === 'harmony') {
            var control = state === true ? 'PowerOn' : 'PowerOff';
            var powerControl = this.getHarmonyControl(modules, device.name, 'Power', control);
            this.sendHarmonyCommand(modules, powerControl.formattedCommand);
            //modules.harmony.hub.send('holdAction', 'action=' + powerControl.formattedCommand + ':status=press');
            power_state = state;
            device.lastState = state;
        }
        return power_state;
    },
    getHarmonyControl: function(modules, device, controlGroup, control) {
        var selectedDevice = modules.harmony.devices.find((eachDevice) => {
            return eachDevice.name === device;
        });
        var selectedCG = selectedDevice.controlGroups.find((cg) => {
                return cg.name === controlGroup;
        });
        var selectedControl = selectedCG.controls.find((thisControl) => {
            return thisControl.name === control;
        });
        return selectedControl;
    },
    getWritableDevices: function(devices) {
        var writableDevices = devices.map((d) => {
            if (d.deviceProto === 'tplink') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.deviceType,
                    ip: d.ip,
                    groups: d.groups
                };
            } else if (d.deviceProto === 'tuyapi') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.deviceType,
                    ip: d.ip,
                    id: d.id,
                    key: d.key,
                    groups: d.groups
                };
            } else if (d.deviceProto === 'harmony') {
                return {
                    name: d.name,
                    deviceProto: d.deviceProto,
                    deviceKind: d.deviceKind,
                    deviceType: d.type,
                    ip: d.ip,
                    groups: d.groups,
                    controlPort: d.ControlPort,
                    manufacturer: d.manufacturer,
                    harmonyProfile: d.deviceProfileUri,
                    deviceModel: d.model,
                    isManualPower: d.isManualPower,
                    controlGroups: d.controlGroups
                };
            }
        });
        return writableDevices;
    },
    getWritableModules: function(modules) {
        console.log(modules);
        return modules; //this is definitely not right, might have to edit modules only when changes are made to the config
    },
    getWritableProfiles: function(profiles) {
        console.log(profiles);
        return profiles;
    },
    getWritableActivities: function(activities) {
        console.log(activities);
        return activities;
    },
    runActivity: function(modules, activities, devices, activityName) {
        var activity = activities.find((eachActivity) => {
            return eachActivity.name.toLowerCase() === activityName.toLowerCase();
        });
        console.log('running activity ' + activity.name);
        activity.commands.forEach((command) => {
            
            var commandingDevice = devices.find((eachDevice) => {
                return eachDevice.name === command.device;
            });
            var controlParams = command.control.split(' ');
            
            if (controlParams[0] === 'tplink' || controlParams[0] === 'tuyapi') {
                var newState;
                if (controlParams[1] === 'PowerOff')
                    newState = false;
                else if (controlParams[1] === 'PowerOn')
                    newState = true;
                else if (controlParams[1] === 'PowerToggle')
                    newState = undefined;
                this.setDeviceState(commandingDevice, newState, modules);
            } else if (controlParams[0] === 'harmony') {
                var controlGroup = controlParams[1];
                var control = controlParams[2];
                var selectedControl = this.getHarmonyControl(modules, commandingDevice.name, controlGroup, control);
                this.sendHarmonyCommand(modules, selectedControl.formattedCommand);

                //update last state of device if the is a power command
                if (controlGroup === 'Power')
                    commandingDevice.lastState = control === 'PowerOn' ? true : false;
            }
        });
    },
    getDeviceState(device) {
        if (device.deviceProto === 'tplink') {
            return device.obj.relayState;
        } else if (device.deviceProto === 'tuyapi') {
            var state;
            return device.obj.get().then( (status) => {
                return status;
            });
        }
    }

};