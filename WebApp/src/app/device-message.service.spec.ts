import { TestBed } from '@angular/core/testing';

import { DeviceMessageService } from './device-message.service';

describe('DeviceMessageServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DeviceMessageService = TestBed.get(DeviceMessageService);
    expect(service).toBeTruthy();
  });
});
