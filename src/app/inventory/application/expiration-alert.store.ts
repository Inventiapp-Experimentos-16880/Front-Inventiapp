import {Injectable, inject, signal} from '@angular/core';
import {forkJoin, Observable, of, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {ExpirationAlert} from '../domain/model/expiration-alert.entity';
import {Product} from '../domain/model/product.entity';
import {Batch} from '../domain/model/batch.entity';
import {ExpirationAlertApi} from '../infrastructure/expiration-alert-api';
import {ExpirationAlertScanResponse, MitigationActionRequest} from '../infrastructure/expiration-alert-response';
import {ProductsApi} from '../infrastructure/products-api';
import {BatchApi} from '../infrastructure/batch-api';

/**
 * Store for the expiration alerts action center (US17).
 * @remarks
 * Aggregates persisted alerts with product names and batch data (quantity/date)
 * via forkJoin, mirroring the US18 aggregation pattern. State is exposed as
 * read-only signals; the view derives enriched/filtered rows with computed().
 * This store is fully isolated: it does not touch dashboard/bell state.
 */
@Injectable({providedIn: 'root'})
export class ExpirationAlertStore {
  private readonly expirationAlertApi = inject(ExpirationAlertApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly batchApi = inject(BatchApi);

  private readonly alertsSignal = signal<ExpirationAlert[]>([]);
  private readonly productsSignal = signal<Product[]>([]);
  private readonly batchesSignal = signal<Batch[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<boolean>(false);
  private readonly scanningSignal = signal<boolean>(false);

  readonly alerts = this.alertsSignal.asReadonly();
  readonly products = this.productsSignal.asReadonly();
  readonly batches = this.batchesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.errorSignal.asReadonly();
  readonly scanning = this.scanningSignal.asReadonly();

  /**
   * Loads alerts and, in parallel, the products and batches needed to resolve
   * product names and batch quantity/expiration data.
   */
  refresh(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(false);

    forkJoin({
      alerts: this.expirationAlertApi.getAlerts(),
      products: this.productsApi.getProducts().pipe(catchError(() => of([] as Product[]))),
      batches: this.batchApi.getBatches().pipe(catchError(() => of([] as Batch[])))
    }).subscribe({
      next: ({alerts, products, batches}) => {
        this.alertsSignal.set(alerts);
        this.productsSignal.set(products);
        this.batchesSignal.set(batches);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set(true);
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Registers a mitigation action on a pending alert.
   * @returns The raw API observable so the caller can react to 400/409/404 statuses.
   */
  registerAction(alertId: string, request: MitigationActionRequest): Observable<ExpirationAlert> {
    return this.expirationAlertApi.registerAction(alertId, request);
  }

  /**
   * Triggers an expiration alert scan for the authenticated owner and refreshes
   * the list on success.
   * @returns The raw API observable so the caller can react to the created count.
   */
  scan(): Observable<ExpirationAlertScanResponse> {
    this.scanningSignal.set(true);
    return this.expirationAlertApi.scan().pipe(
      tap(() => {
        this.scanningSignal.set(false);
        this.refresh();
      }),
      catchError(err => {
        this.scanningSignal.set(false);
        return throwError(() => err);
      })
    );
  }
}
