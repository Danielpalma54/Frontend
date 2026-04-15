import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import {
  FacturaService,
  FacturaDocumentoResponse,
  FacturaInfoResponse
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
  xmlBlobUrl: string | null = null;

  readonly loginUrl = environment.loginUrl;
  readonly portalUrl = environment.portalUrl;

  constructor(
    private facturaService: FacturaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarFactura();
  }

  cargarFactura(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    forkJoin({
      info: this.facturaService.obtenerInfoFactura(),
      docs: this.facturaService.obtenerDocumentosFactura()
    }).subscribe({
      next: ({ info, docs }) => {
        try {
          this.factura = info;
          this.procesarDocumentos(docs);
        } catch (e) {
          console.error('Error procesando documentos:', e);
          this.error = 'El PDF recibido no es válido.';
        } finally {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al cargar factura:', err);

        if (err?.status === 401) {
          this.error = 'No autorizado. Revisa el token JWT.';
        } else if (err?.status === 403) {
          this.error = 'No tienes permisos para ver este comprobante.';
        } else if (err?.status === 404) {
          this.error = 'No se encontró la factura.';
        } else {
          this.error = 'Ocurrió un error al cargar la información.';
        }

        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  procesarDocumentos(docs: FacturaDocumentoResponse): void {
    if (docs.pdfBase64 && docs.pdfBase64.trim() !== '') {
      this.pdfBlobUrl = this.base64ToBlobUrl(docs.pdfBase64, 'application/pdf');
      this.pdfSrc = this.pdfBlobUrl;
    } else {
      this.pdfSrc = null;
      this.pdfBlobUrl = null;
    }

    if (docs.xmlBase64 && docs.xmlBase64.trim() !== '') {
      this.xmlBlobUrl = this.base64ToBlobUrl(docs.xmlBase64, 'application/xml');
    } else {
      this.xmlBlobUrl = null;
    }
  }

  base64ToBlobUrl(base64: string, mimeType: string): string {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Base64 vacío o inválido');
    }

    const cleanBase64 = base64
      .replace(/^data:application\/pdf;base64,/, '')
      .replace(/^data:application\/xml;base64,/, '')
      .replace(/\s/g, '');

    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return URL.createObjectURL(blob);
  }

  descargarPdf(): void {
    if (!this.pdfBlobUrl) return;

    this.descargarArchivo(
      this.pdfBlobUrl,
      `${this.factura?.tipoComprobante ?? 'documento'}-${this.factura?.noComprobante ?? 'archivo'}.pdf`
    );
  }

  descargarXml(): void {
    if (!this.xmlBlobUrl) return;

    this.descargarArchivo(
      this.xmlBlobUrl,
      `${this.factura?.tipoComprobante ?? 'documento'}-${this.factura?.noComprobante ?? 'archivo'}.xml`
    );
  }

  descargarArchivo(url: string, nombre: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
  }

  abrirLogin(): void {
    window.open(this.loginUrl, '_blank', 'noopener,noreferrer');
  }

  abrirPortal(): void {
    window.open(this.portalUrl, '_blank', 'noopener,noreferrer');
  }

  reintentar(): void {
    this.limpiarUrls();
    this.cargarFactura();
  }

  limpiarUrls(): void {
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }

    if (this.xmlBlobUrl) {
      URL.revokeObjectURL(this.xmlBlobUrl);
      this.xmlBlobUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.limpiarUrls();
  }
}