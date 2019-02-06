import { Component, OnInit, Input } from '@angular/core';
import { Device } from '../device';
import { DeviceService } from '../device.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-harmony-controls',
  templateUrl: './harmony-controls.component.html',
  styleUrls: ['./harmony-controls.component.scss']
})
export class HarmonyControlsComponent implements OnInit {

  @Input() harmony_device: Device;

  constructor(
    //private route: ActivatedRoute,
    //private deviceService: DeviceService,
    //private location: Location
  ) { }


  ngOnInit() {
  //   this.getDevice();
  }

  // getDevice(): void {
  //   const id = +this.route.snapshot.paramMap.get('id');
  //   this.deviceService.getDevice(id)
  //     .subscribe(device => this.harmony_device = device);
  // }

}
