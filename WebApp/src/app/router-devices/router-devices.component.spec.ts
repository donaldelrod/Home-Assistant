import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterDevicesComponent } from './router-devices.component';

describe('RouterDevicesComponent', () => {
  let component: RouterDevicesComponent;
  let fixture: ComponentFixture<RouterDevicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouterDevicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouterDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
