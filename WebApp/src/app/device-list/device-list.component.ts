import { Component, OnInit } from '@angular/core';
import { Device } from '../Device';
import { Room } from '../Room';
import { DeviceService } from '../device.service'

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit {

  rooms: string[] = [];
  devices: Device[] = [];

  constructor(private deviceService: DeviceService) { }

  ngOnInit() {
    this.getDevices();
    this.getRooms();
  }

  getDevices(): void {
    this.deviceService.getDevices()
      .subscribe( (devices) => {
        this.devices = devices;
        this.getRooms();
        //console.log(this.devices);
      });
  }

  getRooms(): void {
    this.rooms = [];
    this.devices.forEach( (dev) => {
      if (this.rooms.indexOf(dev.roomName) == -1) {
        this.rooms.push(dev.roomName);
        console.log(this.rooms);
      } 
      // this.rooms[dev.roomID].devices.push(dev);
      // this.rooms[dev.roomID].roomName = dev.roomName;
      // this.rooms[dev.roomID].roomID = dev.roomID;
    });
  }

}
