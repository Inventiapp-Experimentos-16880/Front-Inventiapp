import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {StockMovementType} from '../domain/model/stock-movement.entity';

export interface StockMovementResource extends BaseResource {
  id: number;
  productId: number;
  batchId: number;
  type: StockMovementType;
  quantity: number;
  occurredAt: string; // ISO 8601 format
}

export interface StockMovementResponse extends BaseResponse {
  movements: StockMovementResource[];
}
