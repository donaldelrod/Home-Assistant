import { Component, OnInit, Input } from '@angular/core';
import { Device } from '../Device'
import { DeviceService } from '../device.service'
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.scss']
})
export class DeviceCardComponent implements OnInit {
  @Input() device: Device;

  constructor(private deviceService: DeviceService) { }

  state = new FormControl();

  ngOnInit() {
  }

  setState(d: Device, state: boolean): void {

    console.log(event);

    console.log('lastState: ' + d.lastState + '\tstate: ' + state + '\tlastStateString: ' + d.lastStateString);
    // d.lastState = state;
    // d.lastStateString = state ? 'on' : 'off';
    // if (state) {

    //   //return "On";
    // }
    // else if (!state) {
    //   //return "Off";
    // }

    this.deviceService.toggleDevice(d.deviceID, state).subscribe(dev => this.device = dev);
  }

}
