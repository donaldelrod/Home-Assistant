import { Component, OnInit, Input } from '@angular/core';
import { Device } from '../device';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DeviceService } from '../device.service';

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss']
})


export class DeviceDetailComponent implements OnInit {
  @Input() device: Device;

  editName: boolean = false;
  editType: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private deviceService: DeviceService,
    private location: Location
  ) { }

  ngOnInit() {
    this.getDevice();
  }

  getDevice(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    this.deviceService.getDevice(id)
      .subscribe(device => this.device = device);
  }

  goBack() : void {
    this.location.back();
  }

}
