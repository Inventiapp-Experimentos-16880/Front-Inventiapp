import { Component, inject, OnInit } from '@angular/core';
import { Kit, KitProduct } from '../../domain/model/kit.entity';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import { InventoryStore } from '../../application/inventory.store';
import {MatSnackBar} from '@angular/material/snack-bar';
interface NewKitItem {
  productId: string;
  name: string;
  currentStock: number;
  quantity: number;
  price: number;
  selected: boolean;
}

@Component({
  selector: 'app-new-kit-dialog',
    templateUrl: './new-kit-dialog.html',
  styleUrl: './new-kit-dialog.css',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ]
})

export class NewKitDialogComponent implements OnInit {
  protected readonly store = inject(InventoryStore);
  private dialogRef = inject(MatDialogRef<NewKitDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  nombre: string = '';
  items: NewKitItem[] = [];
  saving: boolean = false;
  kitValidationError = false;
  onKitProductQuantityChange(index: number, value: any): void {
    const n = Number(value);

    const invalid = !Number.isFinite(n) || !Number.isInteger(n) || n <= 0;

    this.kitValidationError = invalid;

    // actualizar el modelo solo si es número finito (permite corrección)
    if (Number.isFinite(n)) {
      this.items[index].quantity = n;
    } else {
      // opcional: no escribir nada para permitir que el usuario corrija
    }
  }
  get loading(): boolean {
    return this.store.loading();
  }

  get error(): string | null {
    return this.store.error();
  }

  get hasValidKitItems(): boolean {
    if (!this.items || this.items.length === 0) return false;
    return this.items.some(i =>
      i.selected &&
      Number.isFinite(i.quantity) &&
      Number.isInteger(i.quantity) &&
      i.quantity > 0 &&
      Number.isFinite(i.price) &&
      i.price > 0
    );
  }
  loadProductsWithStock(): void {
    const stockMap = new Map(this.store.stock().map(s => [s.productId, s.currentStock]));

    this.items = this.store.products()
      .filter(p => p.isActive === true)
      .map(product => {
        const currentStock = stockMap.get(product.id) || 0;
        return {
          productId: product.id,
          name: product.name,
          currentStock: currentStock,
          quantity: 0,
          price: 0,
          selected: false
        };
      });
  }

  ngOnInit(): void {
    this.loadProductsWithStock();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.nombre.trim()) {
      return;
    }

    const itemsToSave = this.items.filter(item => item.selected && item.quantity > 0 && item.price > 0);
    if (itemsToSave.length === 0) {
      return;
    }

    // Validación final: impedir guardar si canSave es false
    if (!this.canSave) {
      this.snackBar.open(this.translate.instant('kits.validationQuantityInteger'), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    const kitProducts: KitProduct[] = itemsToSave.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const newKit = new Kit({
      id: '',
      name: this.nombre,
      price: 0, // Backend calculates totalPrice from items
      products: kitProducts
    });

    // El store se encarga de crear el kit
    this.store.addKit(newKit);
    this.dialogRef.close(newKit);
  }

  incrementQuantity(item: NewKitItem): void {
    if (!item.selected) {
      item.selected = true;
    }
    item.quantity++;
    // limpiar posible flag si ahora es entero positivo
    if (Number.isInteger(item.quantity) && item.quantity > 0) {
      this.kitValidationError = false;
    }
  }

  decrementQuantity(item: NewKitItem): void {
    if (item.quantity > 0) {
      item.quantity--;
      if (item.quantity === 0) {
        item.selected = false;
      }
      if (Number.isInteger(item.quantity) && item.quantity > 0) {
        this.kitValidationError = false;
      }
    }
  }

  toggleSelection(item: NewKitItem): void {
    item.selected = !item.selected;
    if (!item.selected) {
      item.quantity = 0;
      item.price = 0;
    } else {
      // si se selecciona, inicializar en 1 si estaba en 0
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        item.quantity = 1;
      }
    }
    // limpiar flag al cambiar selección
    this.kitValidationError = false;
  }
  get canSave(): boolean {
    if (!this.nombre.trim()) return false;
    const itemsToSave = this.items.filter(i => i.selected);
    if (itemsToSave.length === 0) return false;
    if (this.kitValidationError) return false;
    for (const it of itemsToSave) {
      if (!Number.isFinite(it.quantity) || !Number.isInteger(it.quantity) || it.quantity <= 0) return false;
      if (!Number.isFinite(it.price) || it.price <= 0) return false;
    }
    return true;
  }

}

