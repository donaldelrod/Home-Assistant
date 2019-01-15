import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceMessagesComponent } from './device-messages.component';

describe('DeviceMessagesComponent', () => {
  let component: DeviceMessagesComponent;
  let fixture: ComponentFixture<DeviceMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceMessagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
