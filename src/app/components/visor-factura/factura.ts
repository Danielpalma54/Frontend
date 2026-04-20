import {ChangeDetectorRef,Component,Inject,OnDestroy,OnInit,PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { FacturaInfoResponse, FacturaService } from '../../services/factura.service';
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

  private obtenerTokenDesdeUrl(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const params = new URLSearchParams(window.location.search);

    return (
      params.get('token') ||
      params.get('jwt') ||                      //VERIFICAR 
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
      next: ({ info, pdf }) => {
        this.factura = info;

        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
          this.pdfBlobUrl = null;
        }

        const base64Pdf = this.extraerBase64Pdf(pdf);

        if (base64Pdf) {
          this.pdfBlobUrl = this.toBlob(base64Pdf);
          this.pdfSrc = this.pdfBlobUrl;
        } else {
          this.pdfSrc = null;
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar comprobante:', err);
        this.error = this.obtenerMensajeError(err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerBase64Pdf(res: any): string {
    if (!res) {
      return '';
    }

    if (typeof res === 'string') {
      return res.trim();
    }

    return (
      res.pdfBase64 ||
      res.base64 ||
      res.archivoBase64 ||
      res.fileBase64 ||
      res.data ||
      res.pdf ||
      ''
    ).trim();
  }

  private extraerBase64Xml(res: any): string {
    if (!res) {
      return '';
    }

    if (typeof res === 'string') {
      return res.trim();
    }

    return (
      res.xmlBase64 ||
      res.base64 ||
      res.archivoBase64 ||
      res.fileBase64 ||
      res.data ||
      res.xml ||
      ''
    ).trim();
  }

  private obtenerMensajeError(err: HttpErrorResponse): string {
    const backendMessage =
      err?.error?.message ||
      err?.error?.mensaje ||
      err?.error?.title ||
      '';

    if (err.status === 401 || err.status === 403) {
      return 'Token inválido o expirado';
    }

    if (err.status === 400) {
      if (
        typeof backendMessage === 'string' &&
        /token|jwt|unauthorized|forbidden|inv[aá]lido|expired|expirado/i.test(backendMessage)
      ) {
        return 'Token inválido o expirado';
      }

      return 'Solicitud inválida al consultar el comprobante';
    }

    if (err.status === 404) {
      return 'No se encontró el comprobante solicitado';
    }

    if (err.status === 0) {
      return 'No se pudo conectar con el backend';
    }

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }

    return 'Error al cargar comprobante';
  }

  private toBlob(base64: string): string {
    const clean = base64.replace(/^data:application\/pdf;base64,/, '');
    const bytes = atob(clean);
    const arr = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
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
      next: (res: any) => {
        const xmlBase64 = this.extraerBase64Xml(res);

        let xml = '';
        if (xmlBase64) {
          xml = atob(xmlBase64.replace(/^data:application\/xml;base64,/, ''));
        } else {
          xml = typeof res === 'string' ? res : JSON.stringify(res);
        }

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.factura?.noComprobante || 'comprobante'}.xml`;
        a.click();

        URL.revokeObjectURL(url);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al descargar XML:', err);
        this.error = this.obtenerMensajeError(err);
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