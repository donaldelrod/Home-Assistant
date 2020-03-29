import { Component, OnInit } from '@angular/core';
import { DeviceMessageService } from '../device-message.service';

@Component({
  selector: 'app-device-messages',
  templateUrl: './device-messages.component.html',
  styleUrls: ['./device-messages.component.scss']
})
export class DeviceMessagesComponent implements OnInit {

  constructor(public deviceMessageService: DeviceMessageService) { }

  ngOnInit() {
  }

}
