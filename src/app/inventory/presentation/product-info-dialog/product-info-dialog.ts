import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {TranslatePipe} from '@ngx-translate/core';
import { BatchMovementHistoryDialogComponent } from '../batch-movement-history-dialog/batch-movement-history-dialog';

export interface ProductInfoData {
  title: string;
  productId?: string;
  category?: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  lastReception?: string;   // 'YYYY-MM-DD'
  lot?: string;
  provider?: string;
  expirationDate?: string;  // 'YYYY-MM-DD'
}

@Component({
  selector: 'app-product-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslatePipe],
  templateUrl: './product-info-dialog.html',
  styleUrls: ['./product-info-dialog.css'],
})
export class ProductInfoDialogComponent {
  private readonly dialog = inject(MatDialog);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProductInfoData) {}

  openBatchHistory(): void {
    if (!this.data.productId) return;
    this.dialog.open(BatchMovementHistoryDialogComponent, {
      width: '560px',
      maxWidth: '90vw',
      panelClass: 'batch-movement-history-dialog',
      data: { productId: this.data.productId, productName: this.data.title }
    });
  }
}
