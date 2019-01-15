import { Injectable } from '@angular/core';
import { Device } from './device';
import { DEVICES } from './mock-devices'
import { Observable, of } from 'rxjs'
import { DeviceMessageService } from './device-message.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private devicesURL = 'http://localhost:9875/api/devices/list';

  private authString = '?authToken=xbbnq6y824006067';

  constructor(
    private deviceMessageService: DeviceMessageService,
    private http: HttpClient) { }

  getDevices(): Observable<Device[]> {
    this.log('Refreshed devices');
    const options = {
      params: new HttpParams().set('authToken', 'xbbnq6y824006067')
    }
    let deviceList = null;
    try {
      deviceList = this.http.get<Device[]>(this.devicesURL, options);
    } catch (err) {
      console.log(err);
    }
    return deviceList;
    //return of(DEVICES);
  }

  private log(message: string) {
    this.deviceMessageService.add(message);
  }

  getDevice(id: number): Observable<Device> {
    this.log(`fetched device id=${id}`);
    let deviceList = this.http.get<Device[]>(this.devicesURL + this.authString);
    try {
      return deviceList[id];
    } catch(err) {
      return null;
    }
     
    //return of(DEVICES.find(device => device.deviceID === id));
  }
}

