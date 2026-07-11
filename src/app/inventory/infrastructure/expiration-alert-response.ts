import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {ExpirationAlertStatus, MitigationActionType} from '../domain/model/expiration-alert.entity';

export interface ExpirationAlertResource extends BaseResource {
  id: number;
  batchId: number;
  productId: number;
  expirationDate: string; // ISO 8601 format
  triggeredAt: string; // ISO 8601 format
  status: ExpirationAlertStatus;
  actionType: MitigationActionType | null;
  resolvedAt: string | null; // ISO 8601 format or null
}

export interface ExpirationAlertResponse extends BaseResponse {
  alerts: ExpirationAlertResource[];
}

/**
 * Request body for registering a mitigation action on an alert.
 * quantity is optional; when omitted the backend liquidates/returns the full batch.
 */
export interface MitigationActionRequest {
  actionType: MitigationActionType;
  quantity?: number;
}

/**
 * Response of triggering an expiration alert scan.
 * `created` is the number of new PENDING alerts created for the authenticated owner.
 */
export interface ExpirationAlertScanResponse {
  created: number;
}
