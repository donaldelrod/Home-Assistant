import { Component, OnInit } from '@angular/core';
import { Device } from '../device';
import { DeviceService } from '../device.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  devices: Device[] = [];

  constructor(private deviceService: DeviceService) { }

  ngOnInit() {
    this.getDevices();
  }

  getDevices(): void {
    this.deviceService.getDevices()
      .subscribe(devices => this.devices = devices);
  }

  toggleState(d: Device, state: boolean): void {

    console.log('lastState: ' + d.lastState + '\tstate: ' + state + '\tlastStateString: ' + d.lastStateString);
    // d.lastState = state;
    // d.lastStateString = state ? 'on' : 'off';
    // if (state) {

    //   //return "On";
    // }
    // else if (!state) {
    //   //return "Off";
    // }

    this.deviceService.toggleDevice(d.deviceID, state).subscribe(dev => this.devices[d.deviceID] = dev);
  }
}
