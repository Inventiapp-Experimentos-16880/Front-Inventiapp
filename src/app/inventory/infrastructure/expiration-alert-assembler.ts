import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {ExpirationAlert} from '../domain/model/expiration-alert.entity';
import {ExpirationAlertResource, ExpirationAlertResponse} from './expiration-alert-response';

export class ExpirationAlertAssembler implements BaseAssembler<ExpirationAlert, ExpirationAlertResource, ExpirationAlertResponse> {

  toEntityFromResource(resource: ExpirationAlertResource): ExpirationAlert {
    return new ExpirationAlert({
      id: String(resource.id), // Convert id to string (API returns number)
      batchId: String(resource.batchId), // Convert batchId to string
      productId: String(resource.productId), // Convert productId to string
      expirationDate: resource.expirationDate,
      triggeredAt: resource.triggeredAt,
      status: resource.status,
      actionType: resource.actionType ?? null,
      resolvedAt: resource.resolvedAt ?? null
    });
  }

  toEntitiesFromResponse(response: ExpirationAlertResponse): ExpirationAlert[] {
    return response.alerts.map(alert => this.toEntityFromResource(alert as ExpirationAlertResource));
  }

  toResourceFromEntity(entity: ExpirationAlert): ExpirationAlertResource {
    const resource: ExpirationAlertResource = {
      batchId: Number(entity.batchId),
      productId: Number(entity.productId),
      expirationDate: entity.expirationDate,
      triggeredAt: entity.triggeredAt,
      status: entity.status,
      actionType: entity.actionType,
      resolvedAt: entity.resolvedAt
    } as ExpirationAlertResource;

    // Only include id if it's not empty
    if (entity.id && entity.id.trim() !== '') {
      resource.id = Number(entity.id);
    }

    return resource;
  }
}
