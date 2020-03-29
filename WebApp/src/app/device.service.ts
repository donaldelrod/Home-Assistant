import { Injectable } from '@angular/core';
import { Device } from './Device';
import { DEVICES } from './mock-devices'
import { Observable, of } from 'rxjs'
import { DeviceMessageService } from './device-message.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private devicesURL = 'http://localhost:9875/api/devices/';
  //private devicesURL = 'http://donaldelrod.ddns.net:9875/api/devices/';

  //private authString = '?authToken=xbbnq6y824006067';

  private options = {
    params: new HttpParams().set('authToken', 'xbbnq6y824006067')
  };

  constructor(
    private deviceMessageService: DeviceMessageService,
    private http: HttpClient) { }

  //used by dashboard, gets all connected devices
  getDevices(): Observable<Device[]> {
    this.log('Refreshed devices');
    let deviceList = null;
    try {
      deviceList = this.http.get<Device[]>(this.devicesURL + 'list', this.options);
    } catch (err) {
      console.log(err);
    }
    // console.log('service');
    
    // console.log(deviceList);

    return deviceList;
  }

  private log(message: string) {
    this.deviceMessageService.add(message);
  }

  //used by device-detail, gets a specific device
  getDevice(id: number): Observable<Device> {
    this.log(`fetched device id=${id}`);
    let d = this.http.get<Device>(this.devicesURL + id + '/info', this.options);
    return d;
  }

  getDevicesInRoom(roomID: number): Observable<Device[]> {
    this.log(`fetched devices in room id=${roomID}`);
    let devs = this.http.get<Device[]>(this.devicesURL + '/room/' + roomID, this.options);
    return devs;
  }

  toggleDevice(id: number, state: boolean): Observable<Device> {
    this.log(`toggled device id=${id}`);
    
    let d = this.http.get<Device>(this.devicesURL + id + '/set/' + (state ? '1' : '0'), this.options);
    return d;
  }
}

