# Functions available

# Netgear Router

## getInfo()
gets the details of the router
## getAttachedDevices()
gets the attached devices
## login(password, user, host, port)
logs into the router
## logout()
logs out of the router
## enableParentalControl(bool)
enables/disables parental controls
## enableTrafficMeter(bool)
enables/disables traffic meter
## getGuestWifiEnabled()
returns the 2.4G guest wifi status
## get5GGuestWifiEnabled()
returns the 5G guest wifi status
## get5GGuestWifi2Enabled()
returns the 5G guest wifi 2 status
## getBandwidthControlOptions()
returns bandwidth control options
## getBlockDeviceEnableStatus()
returns if device access control is enabled
## getCurrentSetting(host)
gets router settings without logging in
## getParentalControlEnableStatus()
returns if parental controls are enabled
## setQoSEnableStatus(bool)
enable or disable QoS
## getQoSEnableStatus()
returns the QoS enable status
## getSupportFeatureListXML()
get router SupportFeatureList
## getTrafficMeter()
returns traffic meter statistics
## getTrafficMeterEnabled()
returns if the traffic meter is enabled
## getTrafficMeterOptions()
gets traffic meter options: {newControlOption, newNewMonthlyLimit, restartHour, restartMinute, restartDay}
## reboot()
reboots the router and resolves to <{finished}>
## setGuestWifi(bool)
enable or disable 2.4G guest wifi
## set5GGuestWifi(bool)
enable or disable 5G guest wifi 1
## set5GGuestWifi2(bool)
enable or disable 5G guest wifi 2
## setBandwidthControlOptions(newUplinkBandwidth, newDownLinkBandwidth)
args in Mb/s, resolves to <{finished}>
## setBlockDevice(MAC, 'Allow' or 'Block')
blocks or unblocks a mac address on the router, resolves to MAC address
## setBlockDeviceEnable(bool)
enable or disable blocking devices
## speedTest()
returns internet bandwidth speedtest (takes a while to complete)
## checkNewFirmware()
resolves to <{newFirmwareInfo}>
## updateNewFirmware()
update the router firmware



# GoogleAPIs


# TP-Link


# Tuyapi
## new TuyaDevice(option) 
options = {ip, port, id, key, productKey, version, persistantConnection}
## resolveID(options?)
options = {timeout}
## get(option?)
options = {schema.bool, dps.Number, returnAsEvent.bool}
schema returns the entire schema of the device if true
returnAsEvent will emit a data event instead of returning a promise
## set(option)
option = {dps.number, set}
dps is which porperty to modify
set is value to set with type any
returns a promise that resolves to a bool of command success


# Node-Scheduler
## scheduleJob(cronString, functionToSchedule)
## scheduleJob(Date, functionToSchedule)
## scheduleJob(RecurrenceRule, functionToSchedule)
all of these functions return a variable, lets call it job
## RecurrenceRule()
returns a new RecurrenceRule that can be used to schedule a job
fields: second, minute, hour, date, month, year, dayOfWeek
## job.cancel()
## job.cancelNext(reschedule: maybe a boolean?)
## job.reschedule(spec)

# Harmony Hub
## HarmonyHub(ip)
returns promise that resolves to Harmony object
## getAvailableCommands()
returns an object that contains an array of devices, which each include all of the devices controllable commands
## getActivities()
returns an array containing the registered activities in the harmony hub

## end()
stops connection with the hub


# Proxmox
## getNodes(callback)
## getQemu(node, callback)
## createQemu(node, data, callback)
## getStorage(callback)
## getClusterStatus(callback)
## getClusterBackupSchedule(callback)
## getNodeNetworks(node, callback)
## getNodeInterface(node, interface, callback)
## getNodeContaionerIndex(node, callback)
## getNodeVirtualIndex(node, callback)
## getNodeServiceState(node, service, callback)
## getNodeStorage(node, callback)
## getNodeFinishedTasks(node, callback)
## getNodeDNS(node, callback)
## getNodeSyslog(node, callback)
## getNodeRRD(node, callback)
## getNodeRRDData(node, callback)
## getNodeBeans(node, callback)
## getNodeTaskByUPID(node, upid, callback)
## getNodeTaskStatusByUPID(node, upid, callback)
## getNodeTaskLogByUPID(node, upid, callback)
## getNodeTaskStatusByUPID(node, upid, callback)
## getNodeScanMethods(node, callback)
## getRemoteiSCSI(node, callback)
## getNodeLVMGroups(node, callback)
## getRemoteNFS(node, callback)
## getNodeUSB(node, callback)
## getStorageVolumeData(node, storage, volume, callback)
## getStorageConfig(storage, callback)
## getNodeStorageContent(node, storage, callback)
## getNodeStorageRRD(node, storage, callback)
## getNodeStorageRRDData(node, storage, callback)
## deleteNodeNetworkConfig(node, callback)
## deleteNodeInterface(node, interface, callback)
## deletePool(poolid, callback)
## setNodeDNSDomain(node, domain, callback)
## setNodeSubscriptionKey(node, key, callback)
## setNodeTimeZone(node, timezone, callback)
## setPoolData(poolid, data, callback)
## updateStorageConfiguration(storageid, data, callback)

# Proxmox - Qemu

## qemu.getStatus (node, qemu, callback)
## qemu.getStatusCurrent (node, qemu, callback)
## qemu.start(node, qemu, callback)
## qemu.stop(node, qemu, callback)
## qemu.reset(node, qemu, callback)
## qemu.shutdown(node, qemu, callback)
## qemu.suspend(node, qemu, callback)
## qemu.resume(node, qemu, callback)
## qemu.rrd(node, qemu, callback)
## qemu.rrdData (node, qemu, callback)
## qemu.getConfig(node, qemu, callback)
## qemu.putConfig(node, qemu, data, callback)
## qemu.postConfig(node, qemu, data, callback)
## qemu.pending(node, qemu, callback)
## qemu.unlink(node, qemu, data, callback)
## qemu.vncproxy (node, qemu, callback)
## qemu.vncwebsocket(node, qemu, data, callback)
## qemu.sendkey(node, qemu, data, callback)
## qemu.feature (node, qemu, data, callback)
## qemu.clone (node, qemu, data, callback)
## qemu.moveDisk (node, qemu, data, callback)
## qemu.migrate (node, qemu, data, callback)
## qemu.monitor (node, qemu, data, callback)
## qemu.resize (node, qemu, data, callback)
## qemu.template (node, qemu, callback)