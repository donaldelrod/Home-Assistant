import { TestBed } from '@angular/core/testing';

import { RouterDeviceService } from './router-device.service';

describe('RouterDeviceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RouterDeviceService = TestBed.get(RouterDeviceService);
    expect(service).toBeTruthy();
  });
});
