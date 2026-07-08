import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BatchApi } from './batch-api';
import { environment } from '../../../environments/environment';

describe('BatchApi', () => {
  let service: BatchApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BatchApi]
    });
    service = TestBed.inject(BatchApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMovementsByBatchId should fetch the chronological movement history for a batch', () => {
    const mockMovements = [
      { id: 1, productId: 10, batchId: 5, type: 'ENTRADA', quantity: 20, occurredAt: '2026-01-01T10:00:00Z' },
      { id: 2, productId: 10, batchId: 5, type: 'SALIDA', quantity: 5, occurredAt: '2026-01-02T10:00:00Z' }
    ];

    service.getMovementsByBatchId(5).subscribe(movements => {
      expect(movements.length).toBe(2);
      expect(movements[0].type).toBe('ENTRADA');
      expect(movements[1].type).toBe('SALIDA');
      expect(movements[1].quantity).toBe(5);
    });

    const req = httpMock.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderBatchesEndpointPath}/5/movements`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockMovements);
  });

  it('getBatchesByProductId should fetch batches from the product sub-resource endpoint', () => {
    const mockBatches = [
      { id: 5, productId: 10, quantity: 20, expirationDate: '2026-12-31', receptionDate: '2026-01-01' }
    ];

    service.getBatchesByProductId('10').subscribe(batches => {
      expect(batches.length).toBe(1);
      expect(batches[0].id).toBe('5');
    });

    const req = httpMock.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderProductsEndpointPath}/10/batches`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockBatches);
  });
});
