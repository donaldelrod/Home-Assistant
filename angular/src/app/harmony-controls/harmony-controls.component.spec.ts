import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HarmonyControlsComponent } from './harmony-controls.component';

describe('HarmonyControlsComponent', () => {
  let component: HarmonyControlsComponent;
  let fixture: ComponentFixture<HarmonyControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HarmonyControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HarmonyControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
