import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import {
  FacturaService,
  FacturaInfoResponse,
  PdfResponse,
  XmlResponse
} from '../../services/factura.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-factura',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './factura.html',
  styleUrl: './factura.css'
})
export class FacturaComponent implements OnInit, OnDestroy {
  cargando = false;
  error = '';

  factura: FacturaInfoResponse | null = null;

  pdfSrc: string | null = null;
  pdfBlobUrl: string | null = null;

  tokenDesdeUrl = '';

  readonly loginUrl = environment.loginUrl;
  readonly portalUrl = environment.portalUrl;

  constructor(
    private service: FacturaService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.tokenDesdeUrl = this.obtenerTokenDesdeUrl();

    if (!this.tokenDesdeUrl) {
      this.error = 'No se recibió token en la URL';
      this.cdr.detectChanges();
      return;
    }

    this.cargarFactura();
  }

  reintentar(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.tokenDesdeUrl = this.obtenerTokenDesdeUrl();

    if (!this.tokenDesdeUrl) {
      this.error = 'No se recibió token en la URL';
      this.cdr.detectChanges();
      return;
    }

    this.cargarFactura();
  }

  private obtenerTokenDesdeUrl(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const params = new URLSearchParams(window.location.search);

    return (
      params.get('token') ||
      params.get('jwt') ||
      params.get('encodedJwt') ||
      ''
    ).trim();
  }

  cargarFactura(): void {
    if (!this.tokenDesdeUrl) {
      this.error = 'No se recibió token en la URL';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.factura = null;
    this.pdfSrc = null;

    forkJoin({
      info: this.service.obtenerInfoFactura(this.tokenDesdeUrl),
      pdf: this.service.obtenerPdf(this.tokenDesdeUrl)
    }).subscribe({
      next: ({ info, pdf }: { info: FacturaInfoResponse; pdf: PdfResponse }) => {
        this.factura = info;

        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
          this.pdfBlobUrl = null;
        }

        if (pdf?.pdfBase64) {
          this.pdfBlobUrl = this.convertirBase64PdfAUrl(pdf.pdfBase64);
          this.pdfSrc = this.pdfBlobUrl;
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar comprobante:', err);
        this.error = 'Error al cargar comprobante';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private convertirBase64PdfAUrl(base64: string): string {
    const limpio = base64.replace(/^data:application\/pdf;base64,/, '');
    const bytes = atob(limpio);
    const array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }

    const blob = new Blob([array], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }

  descargarPdf(): void {
    if (!isPlatformBrowser(this.platformId) || !this.pdfBlobUrl) {
      return;
    }

    const a = document.createElement('a');
    a.href = this.pdfBlobUrl;
    a.download = `${this.factura?.noComprobante || 'comprobante'}.pdf`;
    a.click();
  }

  descargarXml(): void {
    if (!isPlatformBrowser(this.platformId) || !this.tokenDesdeUrl) {
      return;
    }

    this.service.obtenerXml(this.tokenDesdeUrl).subscribe({
      next: (res: XmlResponse) => {
        const contenido = res?.xmlBase64 ? atob(res.xmlBase64) : '';
        const blob = new Blob([contenido], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.factura?.noComprobante || 'comprobante'}.xml`;
        a.click();

        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar XML:', err);
        this.error = 'Error al descargar XML';
        this.cdr.detectChanges();
      }
    });
  }

  abrirLogin(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.open(this.loginUrl, '_blank');
  }

  abrirPortal(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.open(this.portalUrl, '_blank');
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }
}