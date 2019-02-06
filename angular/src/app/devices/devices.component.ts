import { Component, OnInit } from '@angular/core';
import { Device } from '../device';
// import { DEVICES } from '../mock-devices';
import { DeviceService } from '../device.service';
//import { HarmonyControls } from '../harmony-controls';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})

export class DevicesComponent implements OnInit {

  devices: Device[];

  selectedDevice: Device;

  getDevices(): void {
    this.deviceService.getDevices()
      .subscribe(devices => this.devices = devices);
  }

  constructor(private deviceService: DeviceService) { }

  ngOnInit() {
    this.getDevices();
  }

  onSelect(device: Device): void {
    this.selectedDevice = device;
  }

}