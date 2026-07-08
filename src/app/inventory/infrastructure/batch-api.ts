import {Injectable} from '@angular/core';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {BatchApiEndpoint} from './batch-api-endpoint';
import {HttpClient} from '@angular/common/http';
import {Batch} from '../domain/model/batch.entity';
import {BatchResource, BatchResponse} from './batch-response';
import {BatchAssembler} from './batch-assembler';
import {StockMovement} from '../domain/model/stock-movement.entity';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class BatchApi extends BaseApi {
  private readonly batchEndpoint: BatchApiEndpoint;
  private readonly batchAssembler = new BatchAssembler();

  constructor(private readonly http: HttpClient) {
    super();
    this.batchEndpoint = new BatchApiEndpoint(http);
  }

  getBatches(): Observable<Batch[]> {
    return this.batchEndpoint.getAll();
  }

  getBatchById(id: number): Observable<Batch> {
    return this.batchEndpoint.getById(id);
  }

  getBatchesByProductId(productId: string): Observable<Batch[]> {
    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderProductsEndpointPath}/${productId}/batches`;
    return this.http.get<BatchResponse | BatchResource[]>(url).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(resource => this.batchAssembler.toEntityFromResource(resource));
        }
        return this.batchAssembler.toEntitiesFromResponse(response as BatchResponse);
      }),
      catchError(() => throwError(() => new Error('Failed to fetch batches by product')))
    );
  }

  createBatch(batch: Batch): Observable<Batch> {
    return this.batchEndpoint.create(batch);
  }

  getMovementsByBatchId(batchId: number): Observable<StockMovement[]> {
    return this.batchEndpoint.getMovementsByBatchId(batchId);
  }
}

