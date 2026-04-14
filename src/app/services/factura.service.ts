import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FacturaInfoResponse {
  numero: string;
  estado: string;
  emisor: string;
  ruc: string;
  nombreComercial?: string;
  receptor: string;
  correo: string;
  fechaEmision: string;
}

export interface FacturaDocumentoResponse {
  pdfBase64: string;
  xmlBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private readonly apiUrl = environment.apiUrl;
  private readonly token = environment.token;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
  }

  obtenerInfoFactura(id: string): Observable<FacturaInfoResponse> {
    return this.http.get<FacturaInfoResponse>(
      `${this.apiUrl}/factura`,
      { headers: this.getHeaders() }
    );
  }

  obtenerDocumentosFactura(id: string): Observable<FacturaDocumentoResponse> {
    return this.http.get<FacturaDocumentoResponse>(
      `${this.apiUrl}/factura/documentos`,
      { headers: this.getHeaders() }
    );
  }
}