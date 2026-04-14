import { Component, OnDestroy, OnInit } from '@angular/core';
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

  readonly facturaId = environment.facturaId;
  readonly loginUrl = environment.loginUrl;
  readonly portalUrl = environment.portalUrl;

  constructor(private facturaService: FacturaService) {}

  ngOnInit(): void {
    this.cargarFactura();
  }

  cargarFactura(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      info: this.facturaService.obtenerInfoFactura(this.facturaId),
      docs: this.facturaService.obtenerDocumentosFactura(this.facturaId)
    }).subscribe({
      next: ({ info, docs }) => {
        this.factura = info;
        this.procesarDocumentos(docs);
        this.cargando = false;
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
      }
    });
  }

  procesarDocumentos(docs: FacturaDocumentoResponse): void {
    if (docs.pdfBase64) {
      this.pdfBlobUrl = this.base64ToBlobUrl(docs.pdfBase64, 'application/pdf');
      this.pdfSrc = this.pdfBlobUrl;
    }

    if (docs.xmlBase64) {
      this.xmlBlobUrl = this.base64ToBlobUrl(docs.xmlBase64, 'application/xml');
    }
  }

  base64ToBlobUrl(base64: string, mimeType: string): string {
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

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
      `factura-${this.factura?.numero ?? this.facturaId}.pdf`
    );
  }

  descargarXml(): void {
    if (!this.xmlBlobUrl) return;
    this.descargarArchivo(
      this.xmlBlobUrl,
      `factura-${this.factura?.numero ?? this.facturaId}.xml`
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