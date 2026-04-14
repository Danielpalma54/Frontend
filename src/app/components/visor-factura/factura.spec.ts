import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisorFactura } from 'services./factura.service';

describe('VisorFactura', () => {
  let component: VisorFactura;
  let fixture: ComponentFixture<VisorFactura>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisorFactura],
    }).compileComponents();

    fixture = TestBed.createComponent(VisorFactura);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
