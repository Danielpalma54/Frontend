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

export interface FacturaDocumentoResponse {
  pdfBase64: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private readonly apiUrl = environment.apiUrl;
  private readonly token = environment.token;

  constructor(private http: HttpClient) {}

  private getBody() {
    return {
      tokenRequest: this.token
    };
  }

  obtenerInfoFactura(): Observable<FacturaInfoResponse> {
    return this.http.post<FacturaInfoResponse>(
      `${this.apiUrl}/api/v1/comprobantes/info`,
      this.getBody()
    );
  }

  obtenerPdf(): Observable<FacturaDocumentoResponse> {
    return this.http.post<FacturaDocumentoResponse>(
      `${this.apiUrl}/api/v1/comprobantes/pdf`,
      this.getBody()
    );
  }

  obtenerXml(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/v1/comprobantes/xml`,
      this.getBody()
    );
  }
}