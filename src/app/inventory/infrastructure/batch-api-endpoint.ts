import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Batch} from '../domain/model/batch.entity';
import {BatchResource, BatchResponse} from './batch-response';
import {BatchAssembler} from './batch-assembler';
import {StockMovement} from '../domain/model/stock-movement.entity';
import {StockMovementResource, StockMovementResponse} from './stock-movement-response';
import {StockMovementAssembler} from './stock-movement-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {catchError, map, Observable} from 'rxjs';

export class BatchApiEndpoint extends BaseApiEndpoint<Batch, BatchResource, BatchResponse, BatchAssembler> {
  private readonly movementAssembler = new StockMovementAssembler();

  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}${environment.platformProviderBatchesEndpointPath}`, new BatchAssembler());
  }

  /**
   * Retrieves the chronological movement history (entries and exits) of a batch.
   * @param batchId The ID of the batch
   * @returns An Observable for an array of stock movements, ordered by occurredAt asc
   */
  getMovementsByBatchId(batchId: number): Observable<StockMovement[]> {
    return this.http.get<StockMovementResponse | StockMovementResource[]>(`${this.endpointUrl}/${batchId}/movements`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(resource => this.movementAssembler.toEntityFromResource(resource));
        }
        return this.movementAssembler.toEntitiesFromResponse(response as StockMovementResponse);
      }),
      catchError(this.handleError('Failed to fetch batch movements'))
    );
  }
}

