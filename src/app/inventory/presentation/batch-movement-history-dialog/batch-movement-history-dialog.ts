import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchApi } from '../../infrastructure/batch-api';
import { Batch } from '../../domain/model/batch.entity';
import { StockMovement } from '../../domain/model/stock-movement.entity';

export interface BatchHistoryDialogData {
  productId: string;
  productName: string;
}

interface BatchPanel {
  batch: Batch;
  movements: StockMovement[] | null; // null = not loaded yet
  loading: boolean;
  error: boolean;
}

@Component({
  selector: 'app-batch-movement-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatExpansionModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './batch-movement-history-dialog.html',
  styleUrls: ['./batch-movement-history-dialog.css'],
})
export class BatchMovementHistoryDialogComponent implements OnInit {
  private readonly batchApi = inject(BatchApi);

  loadingBatches = signal(true);
  loadError = signal(false);
  batchPanels = signal<BatchPanel[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: BatchHistoryDialogData) {}

  ngOnInit(): void {
    this.batchApi.getBatchesByProductId(this.data.productId).subscribe({
      next: (batches) => {
        this.batchPanels.set(batches.map(batch => ({ batch, movements: null, loading: false, error: false })));
        this.loadingBatches.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loadingBatches.set(false);
      }
    });
  }

  onPanelOpened(panel: BatchPanel): void {
    if (panel.movements !== null || panel.loading) return;

    panel.loading = true;
    this.batchApi.getMovementsByBatchId(Number(panel.batch.id)).subscribe({
      next: (movements) => {
        panel.movements = movements;
        panel.loading = false;
        this.batchPanels.set([...this.batchPanels()]);
      },
      error: () => {
        panel.error = true;
        panel.loading = false;
        this.batchPanels.set([...this.batchPanels()]);
      }
    });
  }
}
