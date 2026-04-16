import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FacturaComponent } from './factura';

describe('FacturaComponent', () => {
  let component: FacturaComponent;
  let fixture: ComponentFixture<FacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});