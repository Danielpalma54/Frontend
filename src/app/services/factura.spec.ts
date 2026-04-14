import { TestBed } from '@angular/core/testing';

import { Factura } from './factura.service';

describe('Factura', () => {
  let service: Factura;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Factura);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
