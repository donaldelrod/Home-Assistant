import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceMessageService {

  messages: string[] = [];

  add(message: string) {
    let d = new Date();
    this.messages.push(d.toLocaleString() + ': ' + message);
  }

  clear() {
    this.messages = [];
  }

  constructor() { }
}
