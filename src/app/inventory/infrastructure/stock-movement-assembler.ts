import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {StockMovement} from '../domain/model/stock-movement.entity';
import {StockMovementResource, StockMovementResponse} from './stock-movement-response';

export class StockMovementAssembler implements BaseAssembler<StockMovement, StockMovementResource, StockMovementResponse> {

  toEntityFromResource(resource: StockMovementResource): StockMovement {
    return new StockMovement({
      id: String(resource.id), // Convert id to string (API returns number)
      productId: String(resource.productId), // Convert productId to string
      batchId: String(resource.batchId), // Convert batchId to string
      type: resource.type,
      quantity: resource.quantity,
      occurredAt: resource.occurredAt
    });
  }

  toEntitiesFromResponse(response: StockMovementResponse): StockMovement[] {
    return response.movements.map(movement => this.toEntityFromResource(movement as StockMovementResource));
  }

  toResourceFromEntity(entity: StockMovement): StockMovementResource {
    const resource: StockMovementResource = {
      productId: Number(entity.productId),
      batchId: Number(entity.batchId),
      type: entity.type,
      quantity: entity.quantity,
      occurredAt: entity.occurredAt
    } as StockMovementResource;

    // Only include id if it's not empty
    if (entity.id && entity.id.trim() !== '') {
      resource.id = Number(entity.id);
    }

    return resource;
  }
}
