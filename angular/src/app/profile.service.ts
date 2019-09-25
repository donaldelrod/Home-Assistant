import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from './profile';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private profilesURL = 'http://donaldelrod.ddns.net:9875/api/profiles/list/';

  private options = {
    params: new HttpParams().set('authToken', 'xbbnq6y824006067')
  };

  constructor(
    private http: HttpClient) { }

  getProfiles(): Observable<Profile[]> {
    let profileList = null;
    try {
      profileList = this.http.get<Profile[]>(this.profilesURL, this.options);
    } catch (err) {
      console.log(err);
    }
    return profileList;
  }
}
