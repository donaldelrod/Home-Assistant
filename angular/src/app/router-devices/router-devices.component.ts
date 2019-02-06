import { Component, OnInit } from '@angular/core';
import { routerDevice } from '../routerDevice';
import { RouterDeviceService } from '../router-device.service';

@Component({
  selector: 'app-router-devices',
  templateUrl: './router-devices.component.html',
  styleUrls: ['./router-devices.component.scss']
})
export class RouterDevicesComponent implements OnInit {

  routerDevices: routerDevice[];

  getRouterDevices(): void {
    this.routerDeviceService.getAttachedDevices()
      .subscribe(rd => this.routerDevices = rd);
  }

  constructor(private routerDeviceService: RouterDeviceService) { }

  ngOnInit() {
    this.getRouterDevices();
  }

}
 