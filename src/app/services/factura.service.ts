import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FacturaInfoResponse {
  emisor: string;
  ruc: string;
  razonSocial: string;
  receptor: string;
  correo: string;
  fechaEmision: string;
  tipoComprobante: string;
  noComprobante: string;
  estadoComprobante: string;
  nombreComercial?: string;
}

export interface PdfResponse {
  pdfBase64: string;
}

export interface XmlResponse {
  xmlBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  private crearBody(token: string) {
    return {
      tokenRequest: token
    };
  }

  obtenerInfoFactura(token: string): Observable<FacturaInfoResponse> {
    return this.http.post<FacturaInfoResponse>(
      `${this.apiUrl}/api/v1/comprobantes/info`,
      this.crearBody(token)
    );
  }

  obtenerPdf(token: string): Observable<PdfResponse> {
    return this.http.post<PdfResponse>(
      `${this.apiUrl}/api/v1/comprobantes/pdf`,
      this.crearBody(token)
    );
  }

  obtenerXml(token: string): Observable<XmlResponse> {
    return this.http.post<XmlResponse>(
      `${this.apiUrl}/api/v1/comprobantes/xml`,
      this.crearBody(token)
    );
  }
}