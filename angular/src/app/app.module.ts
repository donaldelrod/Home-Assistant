import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DevicesComponent } from './devices/devices.component';
import { DeviceDetailComponent } from './device-detail/device-detail.component';
import { DeviceMessagesComponent } from './device-messages/device-messages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { HarmonyControlsComponent } from './harmony-controls/harmony-controls.component';

@NgModule({
  declarations: [
    AppComponent,
    DevicesComponent,
    DeviceDetailComponent,
    DeviceMessagesComponent,
    DashboardComponent,
    HarmonyControlsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
