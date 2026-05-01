import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../domain/model/product.entity';
import { Category } from '../domain/model/category.entity';
import { Provider } from '../domain/model/provider.entity';
import { Kit } from '../domain/model/kit.entity';
import { Batch } from '../domain/model/batch.entity';
import { ProductsApi } from '../infrastructure/products-api';
import { CategoryApi } from '../infrastructure/category-api';
import { ProvidersApi } from '../../providers-management/infrastructure/providers-api';
import { KitApi } from '../infrastructure/kit-api';
import { BatchApi } from '../infrastructure/batch-api';

/**
 * Interface for calculated stock from batches.
 */
export interface StockInfo {
  productId: string;
  currentStock: number;
  totalStock?: number;
  expiredStock?: number;
  lastUpdated: string;
}

export const parseDateTimeString = (s?: string): Date | null => {
  if (!s) return null;
  const str = s.trim();
  if (!str) return null;

  // ISO con 'T' y zona
  if (/\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato "YYYY-MM-DD HH:MM:SS(.ffffff)"
  const parts = str.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '00:00:00';

  const dateSegments = datePart.split('-').map(n => Number(n));
  if (dateSegments.length !== 3 || dateSegments.some(isNaN)) return null;
  const [year, month, day] = dateSegments;

  const timeSegments = timePart.split(':');
  if (timeSegments.length < 2) return null;
  const hour = Number(timeSegments[0]) || 0;
  const minute = Number(timeSegments[1]) || 0;

  let second = 0;
  let millisecond = 0;
  if (timeSegments.length >= 3) {
    const secFrag = timeSegments[2];
    const [secStr, fracStr] = secFrag.split('.');
    second = Number(secStr) || 0;
    if (fracStr) {
      const msStr = (fracStr + '000').slice(0, 3);
      millisecond = Number(msStr) || 0;
    }
  }

  const d = new Date(year, month - 1, day, hour, minute, second, millisecond);
  return isNaN(d.getTime()) ? null : d;
};
/**
 * Store for managing inventory state and operations.
 * @remarks
 * This service orchestrates inventory use cases and manages inventory state.
 * Stock is calculated from batches (sum of quantities per product).
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryStore {
  private readonly productsSignal = signal<Product[]>([]);
  private readonly categoriesSignal = signal<Category[]>([]);
  private readonly providersSignal = signal<Provider[]>([]);
  private readonly kitsSignal = signal<Kit[]>([]);
  private readonly batchesSignal = signal<Batch[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly products = this.productsSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly providers = this.providersSignal.asReadonly();
  readonly kits = this.kitsSignal.asReadonly();
  readonly batches = this.batchesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /**
   * Computed stock from batches - calculates total quantity per product.
   */
  readonly stock = computed<StockInfo[]>(() => {
    const batches = this.batches();

    const stockMap = new Map<
      string,
      {
        total: number;
        expired: number;
        lastDateNonExpired: string | null;
        lastDateAny: string | null;
      }
    >();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Extrae YYYY-MM-DD desde varios formatos y devuelve Date en local en esa fecha (medianoche)
    const parseDateOnly = (s?: string): Date | null => {
      if (!s) return null;
      const str = s.trim();
      if (!str) return null;

      // Si es ISO con 'T', tomar la parte antes de 'T'
      let datePart = str;
      if (str.includes('T')) {
        datePart = str.split('T')[0];
      } else if (str.includes(' ')) {
        // Si viene "YYYY-MM-DD HH:MM:SS..." tomar la primera parte
        datePart = str.split(' ')[0];
      }

      const parts = datePart.split('-');
      if (parts.length !== 3) return null;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if ([year, month, day].some(isNaN)) return null;

      // Construir fecha local en medianoche con esos componentes (ignora hora/zona)
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const safeMaxDateStr = (a: string | null, b: string | null): string | null => {
      if (!a) return b;
      if (!b) return a;
      return a > b ? a : b;
    };

    batches.forEach(batch => {
      const productId = String(batch.productId);
      const entry = stockMap.get(productId) || {
        total: 0,
        expired: 0,
        lastDateNonExpired: null as string | null,
        lastDateAny: null as string | null
      };

      entry.total += batch.quantity;

      const batchRec = batch.receptionDate || new Date().toISOString();
      entry.lastDateAny = safeMaxDateStr(entry.lastDateAny, batchRec);

      let isExpired = false;
      const expStr = batch.expirationDate;
      if (expStr && expStr.trim() !== '') {
        const expDateOnly = parseDateOnly(expStr);
        if (expDateOnly) {
          // comparar solo por día: si expDate < today => vencido
          if (expDateOnly.getTime() < today.getTime()) {
            isExpired = true;
          }
        }
        // si expDateOnly es null (fecha inválida) aquí la tratamos como NO vencida.
        // Si prefieres excluir fechas inválidas, pon: if (!expDateOnly) isExpired = true;
      }

      if (isExpired) {
        entry.expired += batch.quantity;
      } else {
        entry.lastDateNonExpired = safeMaxDateStr(entry.lastDateNonExpired, batchRec);
      }

      stockMap.set(productId, entry);
    });

    return Array.from(stockMap.entries()).map(([productId, data]) => {
      const current = Math.max(0, data.total - data.expired);
      const lastDate = data.lastDateNonExpired || data.lastDateAny || new Date().toISOString();
      return {
        productId,
        currentStock: current,
        lastUpdated: lastDate.split('T')[0]
      } as StockInfo;
    });
  });

  readonly hasProducts = computed(() => this.products().length > 0);
  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly hasProviders = computed(() => this.providers().length > 0);
  readonly hasStock = computed(() => this.stock().length > 0);
  readonly hasKits = computed(() => this.kits().length > 0);
  readonly hasBatches = computed(() => this.batches().length > 0);

  constructor(
    private productsApi: ProductsApi,
    private categoriesApi: CategoryApi,
    private providersApi: ProvidersApi,
    private kitApi: KitApi,
    private batchApi: BatchApi
  ) {
    this.loadInventoryData();
  }

  private loadInventoryData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.productsApi.getProducts().subscribe({
      next: (products: Product[]) => {
        this.productsSignal.set(products);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error loading products'));
      }
    });

    this.categoriesApi.getAll().subscribe({
      next: (categories: any[]) => {
        const categoryEntities = categories.map(cat => new Category({
          id: String(cat.id), // Convert id to string (API returns number)
          name: cat.name
        }));
        this.categoriesSignal.set(categoryEntities);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error loading categories'));
      }
    });

    this.providersApi.getProviders().subscribe({
      next: (providers: Provider[]) => {
        this.providersSignal.set(providers);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error loading providers'));
      }
    });

    this.kitApi.getKits().subscribe({
      next: (kits: Kit[]) => {
        this.kitsSignal.set(kits);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error loading kits'));
      }
    });

    // Load batches - stock is calculated from batches
    this.batchApi.getBatches().subscribe({
      next: (batches: Batch[]) => {
        this.batchesSignal.set(batches);
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error loading batches'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Adds a new product to the store.
   * @param product - The product to add.
   */
  addProduct(product: Product): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.productsApi.createProduct(product).subscribe({
      next: (newProduct: Product) => {
        const currentProducts = this.productsSignal();
        this.productsSignal.set([...currentProducts, newProduct]);
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error creating product'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Updates an existing product in the store.
   * @param product - The updated product.
   */
  updateProduct(product: Product): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.productsApi.updateProduct(product, Number(product.id)).subscribe({
      next: (updatedProduct: Product) => {
        const currentProducts = this.productsSignal();
        const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
        if (index > -1) {
          const updatedProducts = [...currentProducts];
          updatedProducts[index] = updatedProduct;
          this.productsSignal.set(updatedProducts);
        }
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error updating product'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Removes a product from the store.
   * @param productId - The ID of the product to remove.
   */
  removeProduct(productId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.productsApi.deleteProduct(Number(productId)).subscribe({
      next: () => {
        const currentProducts = this.productsSignal();
        this.productsSignal.set(currentProducts.filter(p => p.id !== productId));
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error deleting product'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Adds a new category to the store.
   * @param categoryData - The category data to add (name and description).
   */
  addCategory(categoryData: { name: string; description: string }): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.categoriesApi.createCategory(categoryData.name, categoryData.description).subscribe({
      next: (createdCategory: any) => {
        const categoryEntity = new Category({
          id: String(createdCategory.id), // Convert id to string
          name: createdCategory.name
        });
        const currentCategories = this.categoriesSignal();
        this.categoriesSignal.set([...currentCategories, categoryEntity]);
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error creating category'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Updates an existing category in the store.
   * @param category - The updated category.
   */
  updateCategory(category: Category): void {
    const currentCategories = this.categoriesSignal();
    const index = currentCategories.findIndex(c => c.id === category.id);
    if (index > -1) {
      const updatedCategories = [...currentCategories];
      updatedCategories[index] = category;
      this.categoriesSignal.set(updatedCategories);
    }
  }

  /**
   * Removes a category from the store.
   * @param categoryId - The ID of the category to remove.
   */
  removeCategory(categoryId: string): void {
    const currentCategories = this.categoriesSignal();
    this.categoriesSignal.set(currentCategories.filter(c => c.id !== categoryId));
  }

  /**
   * Adds a new kit to the store.
   * @param kit - The kit to add.
   */
  addKit(kit: Kit): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.kitApi.createKit(kit).subscribe({
      next: (createdKit: Kit) => {
        const currentKits = this.kitsSignal();
        this.kitsSignal.set([...currentKits, createdKit]);
        this.loadingSignal.set(false);
      },
      error: (err: Error) => {
        this.errorSignal.set(this.formatError(err, 'Error creating kit'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Updates an existing kit in the store.
   * @param kit - The updated kit.
   */
  updateKit(kit: Kit): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.kitApi.updateKit(kit, Number(kit.id)).subscribe({
      next: (updatedKit: Kit) => {
        const currentKits = this.kitsSignal();
        const index = currentKits.findIndex(k => k.id === updatedKit.id);
        if (index > -1) {
          const updatedKits = [...currentKits];
          updatedKits[index] = updatedKit;
          this.kitsSignal.set(updatedKits);
        }
        this.loadingSignal.set(false);
      },
      error: (err: Error) => {
        this.errorSignal.set(this.formatError(err, 'Error updating kit'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Removes a kit from the store.
   * @param kitId - The ID of the kit to remove.
   */
  removeKit(kitId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.kitApi.deleteKit(Number(kitId)).subscribe({
      next: () => {
        const currentKits = this.kitsSignal();
        this.kitsSignal.set(currentKits.filter(k => k.id !== kitId));
        this.loadingSignal.set(false);
      },
      error: (err: Error) => {
        this.errorSignal.set(this.formatError(err, 'Error deleting kit'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Adds a new batch to the store (replaces old restocking functionality).
   * @param batch - The batch to add.
   */
  addBatch(batch: Batch): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.batchApi.createBatch(batch).subscribe({
      next: (createdBatch: Batch) => {
        const currentBatches = this.batchesSignal();
        this.batchesSignal.set([...currentBatches, createdBatch]);
        this.loadingSignal.set(false);
      },
      error: (err: any) => {
        this.errorSignal.set(this.formatError(err, 'Error creating batch'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Gets current stock for a specific product.
   * @param productId - The product ID.
   * @returns The current stock quantity for the product.
   */
  getStockForProduct(productId: string): number {
    const stockInfo = this.stock().find(s => s.productId === productId);
    return stockInfo?.currentStock || 0;
  }

  /**
   * Gets batches for a specific product.
   * @param productId - The product ID.
   * @returns Array of batches for the product.
   */
  getBatchesForProduct(productId: string): Batch[] {
    return this.batches().filter(b => String(b.productId) === productId);
  }

  /**
   * Refreshes inventory data.
   */
  refresh(): void {
    this.loadInventoryData();
  }

  /**
   * Formats error messages for better user experience.
   * @param error - The error object.
   * @param fallback - The fallback message if error is not an Error instance.
   * @returns A formatted error message.
   */
  private formatError(error: any, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found') ? `${fallback}: Not found` : error.message;
    }
    return fallback;
  }
}
