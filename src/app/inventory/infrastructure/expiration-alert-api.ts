import {Injectable} from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {ExpirationAlertApiEndpoint} from './expiration-alert-api-endpoint';
import {HttpClient} from '@angular/common/http';
import {ExpirationAlert} from '../domain/model/expiration-alert.entity';
import {ExpirationAlertScanResponse, MitigationActionRequest} from './expiration-alert-response';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class ExpirationAlertApi extends BaseApi {
  private readonly expirationAlertEndpoint: ExpirationAlertApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.expirationAlertEndpoint = new ExpirationAlertApiEndpoint(http);
  }

  /**
   * Retrieves the list of persisted expiration alerts.
   */
  getAlerts(): Observable<ExpirationAlert[]> {
    return this.expirationAlertEndpoint.getAll();
  }

  /**
   * Registers a mitigation action on a pending alert.
   * @param alertId The ID of the alert to resolve
   * @param request The action type and optional quantity
   */
  registerAction(alertId: string, request: MitigationActionRequest): Observable<ExpirationAlert> {
    return this.expirationAlertEndpoint.registerAction(alertId, request);
  }

  /**
   * Triggers an expiration alert scan for the authenticated owner.
   */
  scan(): Observable<ExpirationAlertScanResponse> {
    return this.expirationAlertEndpoint.scan();
  }
}
