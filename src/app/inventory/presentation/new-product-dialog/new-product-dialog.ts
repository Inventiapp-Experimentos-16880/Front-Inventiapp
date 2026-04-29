import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { InventoryStore } from '../../application/inventory.store';
import { Product } from '../../domain/model/product.entity';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProductDialogData {
  product?: Product;
}

@Component({
  selector: 'app-new-product-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslatePipe],
  templateUrl: './new-product-dialog.html',
  styleUrls: ['./new-product-dialog.css'],
})
export class NewProductDialogComponent {
  protected readonly store = inject(InventoryStore);
  private dialogRef = inject(MatDialogRef<NewProductDialogComponent>);
  private readonly data = inject<ProductDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly isEditMode = !!this.data?.product;

  form = {
    name: this.data?.product?.name ?? '',
    description: this.data?.product?.description ?? '',
    categoryId: this.data?.product?.categoryId ?? '',
    providerId: this.data?.product?.providerId ?? '',
    minStock: this.data?.product?.minStock ?? 0,
    unitPrice: this.data?.product?.unitPrice ?? ('' as string | number),
    isActive: this.data?.product?.isActive ?? true
  };


  get isValid(): boolean {
    const price = Number(String(this.form.unitPrice).replace(',', '.'));
    return (
      this.form.name.trim().length > 0 &&
      !!this.form.categoryId &&
      !!this.form.providerId &&
      Number(this.form.minStock) >= 0 &&
      !isNaN(price) && price >= 0
    );
  }

  cancel() { this.dialogRef.close(false); }

  save() {
    const unitPrice = Number(String(this.form.unitPrice).replace(',', '.'));
    const productId = this.data?.product?.id ?? '';

    const product = new Product({
      id: productId, // En creación el backend asigna ID; en edición se conserva
      name: this.form.name.trim(),
      description: this.form.description.trim(),
      categoryId: this.form.categoryId,
      providerId: String(this.form.providerId),
      minStock: Number(this.form.minStock),
      unitPrice,
      isActive: this.form.isActive
    });

    if (this.isEditMode) {
      this.store.updateProduct(product);
    } else {
      this.store.addProduct(product);
    }

    this.dialogRef.close(true);
  }
}
