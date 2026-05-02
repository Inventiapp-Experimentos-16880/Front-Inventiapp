import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../application/inventory.store';
import { Batch } from '../../domain/model/batch.entity';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-restocking-dialog',
  templateUrl: './restocking-dialog.html',
  styleUrls: ['./restocking-dialog.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    FormsModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    MatSnackBarModule
  ],
  providers: [provideNativeDateAdapter()]
})
export class RestockingDialogComponent implements OnInit {
  protected readonly store = inject(InventoryStore);
  private dialogRef = inject(MatDialogRef<RestockingDialogComponent>);
  private snackBar = inject(MatSnackBar);

  selectedProductId: string = '';
  quantity: number = 0;
  fechaRecepcion: Date | null = null;
  fechaVencimiento: Date | null = null;

  // Flag para marcar cantidad inválida (decimales, no número o <= 0)
  quantityInvalid = false;

  get loading(): boolean {
    return this.store.loading();
  }

  get error(): string | null {
    return this.store.error();
  }

  get products() {
    return this.store.products().filter(p => p.isActive === true);
  }

  get selectedProduct() {
    return this.products.find(p => p.id === this.selectedProductId);
  }

  get currentStock(): number {
    if (!this.selectedProductId) return 0;

    // Calculate stock from batches
    const batches = this.store.batches();
    return batches
      .filter(b => b.productId === this.selectedProductId)
      .reduce((sum, batch) => sum + batch.quantity, 0);
  }

  get totalStock(): number {
    return this.currentStock + (Number.isFinite(this.quantity) ? this.quantity : 0);
  }

  ngOnInit(): void {
    // No need to load anything, data is already in store
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.canSave) return;

    // Validar integer de nuevo antes de enviar
    if (!Number.isFinite(this.quantity) || !Number.isInteger(this.quantity) || this.quantity <= 0) {
      this.quantityInvalid = true;
      this.snackBar.open('Cantidad inválida. Debe ser un entero positivo.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const batch = new Batch({
      id: '', // Backend will assign the ID
      productId: this.selectedProductId,
      quantity: this.quantity,
      expirationDate: this.fechaVencimiento!.toISOString(),
      receptionDate: this.fechaRecepcion!.toISOString()
    });

    this.store.addBatch(batch);
    this.dialogRef.close(true);
  }

  incrementQuantity(): void {
    // increment preserves integer
    this.quantity = Number.isFinite(this.quantity) ? this.quantity + 1 : 1;
    this.quantityInvalid = false;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity = this.quantity - 1;
      this.quantityInvalid = false;
    } else {
      this.quantity = 0;
      // If zero, it's invalid for saving (canSave will prevent)
    }
  }

  onQuantityChange(value?: any): void {
    // value comes from ngModelChange; if not provided, use this.quantity
    const v = (value !== undefined) ? value : this.quantity;
    if (v === null || v === undefined || v === '') {
      this.quantityInvalid = true;
      this.quantity = 0;
      return;
    }

    const n = Number(v);
    // Valid if finite integer and > 0
    this.quantityInvalid = !Number.isFinite(n) || !Number.isInteger(n) || n <= 0;

    // Keep the numeric value (do not auto-floor) so user can correct
    this.quantity = Number.isFinite(n) ? n : 0;
  }

  isValidDate(d: Date | null): boolean {
    return d !== null && d instanceof Date && !isNaN(d.getTime());
  }

  isExpirationBeforeReception(): boolean {
    if (!this.isValidDate(this.fechaRecepcion) || !this.isValidDate(this.fechaVencimiento)) return false;
    return this.fechaVencimiento! < this.fechaRecepcion!;
  }

  get canSave(): boolean {
    const productOk = !!this.selectedProductId;
    const quantityOk = Number.isFinite(this.quantity) && Number.isInteger(this.quantity) && this.quantity > 0 && !this.quantityInvalid;
    const recOk = this.isValidDate(this.fechaRecepcion);
    const expOk = this.isValidDate(this.fechaVencimiento);
    const orderOk = !this.isExpirationBeforeReception();
    return productOk && quantityOk && recOk && expOk && orderOk && !this.loading;
  }
}
