import { Component } from '@angular/core';
import { FacturaComponent } from './components/visor-factura/factura';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FacturaComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}