import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {ExpirationAlert} from '../domain/model/expiration-alert.entity';
import {
  ExpirationAlertResource,
  ExpirationAlertResponse,
  ExpirationAlertScanResponse,
  MitigationActionRequest
} from './expiration-alert-response';
import {ExpirationAlertAssembler} from './expiration-alert-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map, Observable} from 'rxjs';

export class ExpirationAlertApiEndpoint extends BaseApiEndpoint<ExpirationAlert, ExpirationAlertResource, ExpirationAlertResponse, ExpirationAlertAssembler> {

  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}${environment.platformProviderExpirationAlertsEndpointPath}`, new ExpirationAlertAssembler());
  }

  /**
   * Registers a mitigation action (liquidation or return) on a pending alert.
   * @param alertId The ID of the alert to resolve
   * @param request The action type and optional quantity (omit quantity to affect the whole batch)
   * @returns An Observable of the resolved alert
   * @remarks Errors are re-thrown as the original HttpErrorResponse so callers can
   * distinguish 404 (not found), 409 (already resolved) and 400 (invalid quantity).
   */
  registerAction(alertId: string, request: MitigationActionRequest): Observable<ExpirationAlert> {
    return this.http.post<ExpirationAlertResource>(`${this.endpointUrl}/${alertId}/actions`, request).pipe(
      map(resource => this.assembler.toEntityFromResource(resource))
    );
  }

  /**
   * Triggers an expiration alert scan for the authenticated owner.
   * @returns An Observable with the number of new PENDING alerts created (idempotent).
   */
  scan(): Observable<ExpirationAlertScanResponse> {
    return this.http.post<ExpirationAlertScanResponse>(`${this.endpointUrl}/scan`, {});
  }
}
