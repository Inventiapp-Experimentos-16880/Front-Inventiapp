// typescript
import {Component, inject, ChangeDetectorRef, computed, signal} from '@angular/core';
import {SalesStore} from '../../../application/sales.store';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {KitResource} from '../../../../inventory/infrastructure/kit-response';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {Kit} from '../../../../inventory/domain/model/kit.entity';
import {ProductsApi} from '../../../../inventory/infrastructure/products-api';
import {SalesApi} from '../../../infrastructure/sales-api';
import {AuthStore} from '../../../../auth/application/auth.store';

interface ViewProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  type: 'product' | 'kit';
  productId?: string;
  kitId?: string;
}

@Component({
  selector: 'app-sales-tables',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, TranslatePipe, MatFormField, MatInput, FormsModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './sales-tables.html',
  styleUrls: ['./sales-tables.css']
})
export class SalesTables {
  protected readonly store = inject(SalesStore);
  protected readonly inventoryStore = inject(InventoryStore);
  private readonly productsApi = inject(ProductsApi);
  private readonly salesApi = inject(SalesApi);
  private readonly authStore = inject(AuthStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  searchTerm = signal<string>('');

  ngOnInit() {
    // Cargar productos, batches y kits al iniciar el componente
    this.store.refresh()
    this.inventoryStore.refresh();
  };

  get availableKits() {
    // All kits from backend are considered active (no isEnabled field)
    return this.inventoryStore.kits();
  }

  // Usar computed para evitar ejecuciones repetidas
  products = computed(() => {
    const products = this.store.products();
    const batches = this.store.batches();

    // Usar el stock calculado en InventoryStore (excluye batches vencidos)
    const stockByProduct = new Map<string, number>(
      this.inventoryStore.stock().map(s => [s.productId, s.currentStock])
    );

    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: (p.unitPrice ?? 0),
      stock: stockByProduct.get(p.id) ?? 0
    }));
  });

  // Filtered products based on search term
  filteredProducts = computed(() => {
    const allProducts = this.products();
    const search = this.searchTerm().toLowerCase().trim();

    if (!search) {
      return allProducts;
    }

    return allProducts.filter(p =>
      p.name.toLowerCase().includes(search)
    );
  });

  // Obtener stock disponible de un producto
  getAvailableStock(productId: string): number {
    const product = this.products().find(p => p.id === productId);
    if (!product) return 0;

    // Calcular stock ya reservado en el carrito
    const cartItem = this.cartItems.find(item => item.type === 'product' && item.productId === productId);
    const reservedQuantity = cartItem ? cartItem.quantity : 0;

    return product.stock - reservedQuantity;
  }

  get kits(): KitResource[] {
    const kits = this.store.kits();

    return kits.map(k => ({
      id: Number(k.id) || 0,
      name: k.name,
      items: k.products.map(p => ({
        productId: Number(p.productId),
        quantity: p.quantity,
        price: p.price
      }))
    }));
  }


  cartItems: CartItem[] = [];

  cartValidationError = false;

  get totalAmount(): number {
    return this.cartItems.reduce((s, i) => s + i.total, 0);
  }

  getProductName(productId: string): string {
    const product = this.store.products().find(p => p.id === productId);
    return product?.name || this.translate.instant('inventory.product') + ' #' + productId;
  }

  getTotalKitPrice(kit: Kit): number {
    return kit.products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  }

  addProductToCart(product: ViewProduct): void {
    if (!product || !product.id) {
      console.error('Producto inválido:', product);
      return;
    }

    // Validar stock disponible
    const availableStock = this.getAvailableStock(product.id);
    if (availableStock <= 0) {
      this.snackBar.open(this.translate.instant('sales.noStockAvailable', { product: product.name }), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    // Obtener el producto completo desde el endpoint
    const productId = Number(product.id);
    if (isNaN(productId)) {
      console.error('ID de producto inválido:', product.id);
      return;
    }

    this.productsApi.getProductById(productId).subscribe({
      next: (fullProduct) => {
        // Verificar si el producto ya está en el carrito
        const existingItem = this.cartItems.find(item => item.type === 'product' && item.productId === product.id);

        if (existingItem) {
          // Si ya existe, aumentar la cantidad (con validación de stock)
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > product.stock) {
            this.snackBar.open(this.translate.instant('sales.stockInsufficient', { product: product.name, stock: product.stock }), this.translate.instant('global.cancel'), {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            return;
          }
          this.updateQuantity(existingItem, newQuantity);
        } else {
          // Si no existe, agregarlo con cantidad 1
          const newItem: CartItem = {
            id: `product-${fullProduct.id}`,
            name: fullProduct.name,
            unitPrice: fullProduct.unitPrice ?? 0,
            quantity: 1,
            total: fullProduct.unitPrice ?? 0,
            type: 'product',
            productId: String(fullProduct.id)
          };
          this.cartItems = [...this.cartItems, newItem];
        }

        // Forzar detección de cambios
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener el producto:', error);
        // Fallback: usar los datos del producto de la lista
        const existingItem = this.cartItems.find(item => item.type === 'product' && item.productId === product.id);
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > product.stock) {
            this.snackBar.open(this.translate.instant('sales.stockInsufficient', { product: product.name, stock: product.stock }), this.translate.instant('global.cancel'), {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            return;
          }
          this.updateQuantity(existingItem, newQuantity);
        } else {
          const newItem: CartItem = {
            id: `product-${product.id}`,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
            total: product.price,
            type: 'product',
            productId: product.id
          };
          this.cartItems = [...this.cartItems, newItem];
          this.cdr.detectChanges();
        }
      }
    });
  }

  addKitToCart(kit: Kit): void {
    // Verificar si el kit ya está en el carrito
    const existingItem = this.cartItems.find(item => item.type === 'kit' && item.kitId === kit.id);

    if (existingItem) {
      // Si ya existe, aumentar la cantidad
      this.updateQuantity(existingItem, existingItem.quantity + 1);
    } else {
      // Si no existe, agregarlo con cantidad 1
      const kitPrice = this.getTotalKitPrice(kit);
      const newItem: CartItem = {
        id: `kit-${kit.id}`,
        name: kit.name,
        unitPrice: kitPrice,
        quantity: 1,
        total: kitPrice,
        type: 'kit',
        kitId: kit.id
      };
      this.cartItems = [...this.cartItems, newItem];
    }
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    // Validar que sea número finito y entero
    if (!Number.isFinite(newQuantity) || !Number.isInteger(newQuantity)) {
      this.snackBar.open(this.translate.instant('common.validationNumber'), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      // Restaurar la vista con el valor previo del modelo
      this.cartItems = [...this.cartItems];
      this.cdr.detectChanges();
      return;
    }

    if (newQuantity <= 0) {
      // Si baja a 0 o negativo, eliminar el ítem
      this.deleteItem(item);
      return;
    }

    const quantity = newQuantity;

    // Validar stock si es un producto
    if (item.type === 'product' && item.productId) {
      const product = this.products().find(p => p.id === item.productId);
      if (product && quantity > product.stock) {
        this.snackBar.open(this.translate.instant('sales.stockInsufficient', { product: product.name, stock: product.stock }), this.translate.instant('global.cancel'), {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Ajustar a la cantidad máxima disponible
        item.quantity = product.stock;
        item.total = item.unitPrice * product.stock;
        this.cartValidationError = false;
        item.quantity = quantity;
        item.total = item.unitPrice * quantity;
        this.cartItems = [...this.cartItems];
        this.cdr.detectChanges();
        return;
      }
    }

    item.quantity = quantity;
    item.total = item.unitPrice * quantity;
    // Actualizar el array para que Angular detecte el cambio
    this.cartItems = [...this.cartItems];
    this.cdr.detectChanges();
  }

  onCartQuantityChange(item: CartItem, rawValue: any): void {
    const n = Number(rawValue);

    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
      this.cartValidationError = true;

      this.snackBar.open(this.translate.instant('common.validationNumber'), this.translate.instant('global.cancel'), {
        duration: 2500,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.cartItems = [...this.cartItems];
      this.cdr.detectChanges();
      return;
    }

    this.cartValidationError = false;
    this.updateQuantity(item, n);
  }

  deleteItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter(i => i !== item);
    this.cartValidationError = false;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  cancelOrder(): void {
    this.cartItems = [];
  }

  get hasInvalidQuantities(): boolean {
    return this.cartValidationError || this.cartItems.some(item =>
      !Number.isFinite(item.quantity) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    );
  }

  saveOrder(): void {
    if (this.cartItems.length === 0) {
      this.snackBar.open(this.translate.instant('sales.emptyCart'), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    if (this.hasInvalidQuantities) {
      this.snackBar.open(this.translate.instant('common.validateNumberCart'), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    // Validar stock antes de guardar
    for (const item of this.cartItems) {
      if (item.type === 'product' && item.productId) {
        const product = this.products().find(p => p.id === item.productId);
        if (product && item.quantity > product.stock) {
          this.snackBar.open(this.translate.instant('sales.stockInsufficient', { product: item.name, stock: product.stock }), this.translate.instant('global.cancel'), {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          return;
        }
      }
    }

    // Obtener el usuario actual
    const currentUser = this.authStore.currentUser();
    if (!currentUser || !currentUser.id) {
      this.snackBar.open(this.translate.instant('sales.userNotIdentified'), this.translate.instant('global.cancel'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    // Preparar los datos para el endpoint
    const products = this.cartItems
      .filter(item => item.type === 'product')
      .map(item => ({
        productId: Number(item.productId!),
        quantity: item.quantity
      }));

    const kits = this.cartItems
      .filter(item => item.type === 'kit')
      .map(item => ({
        kitId: Number(item.kitId!),
        quantity: item.quantity
      }));

    const saleData = {
      staffUserId: Number(currentUser.id),
      products: products,
      kits: kits
    };

    // Enviar la venta al backend
    this.salesApi.createSale(saleData).subscribe({
      next: (_response) => {
        this.snackBar.open(this.translate.instant('sales.saleSaved'), this.translate.instant('global.cancel'), {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Limpiar el carrito después de guardar
        this.cartItems = [];
        // Recargar batches para actualizar el stock
        this.store.loadBatches();
        this.inventoryStore.refresh();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al guardar la venta:', error);
        this.snackBar.open(this.translate.instant('sales.saleSaveError'), this.translate.instant('global.cancel'), {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
}
