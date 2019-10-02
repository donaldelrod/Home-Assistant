import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DevicesComponent } from './devices/devices.component';
import { DeviceDetailComponent } from './device-detail/device-detail.component';
import { DeviceMessagesComponent } from './device-messages/device-messages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { HarmonyControlsComponent } from './harmony-controls/harmony-controls.component';
import { RouterDevicesComponent } from './router-devices/router-devices.component';
import { ProfilesComponent } from './profiles/profiles.component';
import { DeviceListComponent } from './device-list/device-list.component';
import { DeviceCardComponent } from './device-card/device-card.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'

@NgModule({
  declarations: [
    AppComponent,
    DevicesComponent,
    DeviceDetailComponent,
    DeviceMessagesComponent,
    DashboardComponent,
    HarmonyControlsComponent,
    RouterDevicesComponent,
    ProfilesComponent,
    DeviceListComponent,
    DeviceCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    MatSlideToggleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
