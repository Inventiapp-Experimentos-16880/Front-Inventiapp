import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BatchApi } from '../../infrastructure/batch-api';
import { StockMovement, StockMovementType } from '../../domain/model/stock-movement.entity';

export interface BatchHistoryDialogData {
  productId: string;
  productName: string;
  /** Optional batch id to preselect in the batch filter; defaults to 'ALL' when omitted. */
  initialBatchId?: string;
}

@Component({
  selector: 'app-batch-movement-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe
  ],
  templateUrl: './batch-movement-history-dialog.html',
  styleUrls: ['./batch-movement-history-dialog.css'],
  providers: [provideNativeDateAdapter()]
})
export class BatchMovementHistoryDialogComponent implements OnInit {
  private readonly batchApi = inject(BatchApi);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  loadError = signal(false);
  movements = signal<StockMovement[]>([]);
  readonly displayedColumns = ['type', 'quantity', 'date', 'lot'];

  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  typeFilter = signal<StockMovementType | 'ALL'>('ALL');
  batchFilter = signal<string | 'ALL'>('ALL');

  readonly availableBatches = computed(() => {
    const ids = new Set(this.movements().map(m => m.batchId));
    return Array.from(ids).sort((a, b) => Number(a) - Number(b));
  });

  readonly filteredMovements = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const type = this.typeFilter();
    const batchId = this.batchFilter();

    const fromTime = from ? this.startOfDay(from).getTime() : null;
    const toTime = to ? this.endOfDay(to).getTime() : null;

    return this.movements().filter(movement => {
      const occurredAt = new Date(movement.occurredAt).getTime();
      if (fromTime !== null && occurredAt < fromTime) return false;
      if (toTime !== null && occurredAt > toTime) return false;
      if (type !== 'ALL' && movement.type !== type) return false;
      if (batchId !== 'ALL' && movement.batchId !== batchId) return false;
      return true;
    });
  });

  readonly hasActiveFilters = computed(() =>
    this.dateFrom() !== null || this.dateTo() !== null || this.typeFilter() !== 'ALL' || this.batchFilter() !== 'ALL'
  );

  constructor(@Inject(MAT_DIALOG_DATA) public data: BatchHistoryDialogData) {}

  ngOnInit(): void {
    this.batchFilter.set(this.data.initialBatchId ?? 'ALL');

    this.batchApi.getBatchesByProductId(this.data.productId).subscribe({
      next: (batches) => {
        if (batches.length === 0) {
          this.movements.set([]);
          this.loading.set(false);
          return;
        }

        const movementRequests = batches.map(batch =>
          this.batchApi.getMovementsByBatchId(Number(batch.id)).pipe(
            catchError(() => of([] as StockMovement[]))
          )
        );

        forkJoin(movementRequests).subscribe({
          next: (movementsPerBatch) => {
            const allMovements = movementsPerBatch.flat();
            allMovements.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
            this.movements.set(allMovements);
            this.loading.set(false);
          },
          error: () => {
            this.loadError.set(true);
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  batchLabel(batchId: string): string {
    return `L-${batchId}`;
  }

  clearFilters(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.typeFilter.set('ALL');
    this.batchFilter.set('ALL');
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  goToExpiringReport(): void {
    this.dialog.closeAll();
    this.router.navigate(['/reportes'], { queryParams: { tab: 'expiring' } });
  }
}
