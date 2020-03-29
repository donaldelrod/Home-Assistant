import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterCardComponent } from './router-card.component';

describe('RouterCardComponent', () => {
  let component: RouterCardComponent;
  let fixture: ComponentFixture<RouterCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouterCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouterCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
