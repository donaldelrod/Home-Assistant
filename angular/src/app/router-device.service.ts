import { Injectable } from '@angular/core';
import { routerDevice } from './routerDevice'
import { Observable } from 'rxjs'
import { DeviceMessageService } from './device-message.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RouterDeviceService {

  
  private routerURL = 'http://localhost:9875/api/netgear/attached';
  //private routerURL = 'http://donaldelrod.ddns.net:9875/api/netgear/attached';

  private options = {
    params: new HttpParams().set('authToken', 'xbbnq6y824006067')
  };


  constructor(
    private http: HttpClient
  ) { }

  getAttachedDevices(): Observable<routerDevice[]> {
    let routerDevices = null;
    try {
      routerDevices = this.http.get<routerDevice[]>(this.routerURL, this.options);
    } catch (err) {
      console.log(err);
    }
    return routerDevices;
  }
}
