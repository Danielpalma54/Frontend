import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FacturaInfoResponse {
  emisor?: string;
  ruc?: string;
  razonSocial?: string;
  receptor?: string;
  correo?: string;
  fechaEmision?: string;
  tipoComprobante?: string;
  noComprobante?: string;
  estadoComprobante?: string;
  nombreComercial?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  private body(token: string) {
    return {
      tokenRequest: token
    };
  }

  obtenerInfoFactura(token: string): Observable<FacturaInfoResponse> {
    return this.http.post<FacturaInfoResponse>(
      `${this.apiUrl}/api/v1/comprobantes/info`,
      this.body(token)
    );
  }

  obtenerPdf(token: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/v1/comprobantes/pdf`,
      this.body(token)
    );
  }

  obtenerXml(token: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/v1/comprobantes/xml`,
      this.body(token)
    );
  }
}