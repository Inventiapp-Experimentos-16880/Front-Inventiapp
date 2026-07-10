export class PlanEntity {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  stripePriceId: string;
  maxRecipes: number;
  maxKits: number;
  maxDevices: number;

  constructor(data: Partial<PlanEntity>) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.description = data.description ?? '';
    this.price = data.price ?? 0;
    this.currency = data.currency ?? 'usd';
    this.billingInterval = data.billingInterval ?? 'month';
    this.stripePriceId = data.stripePriceId ?? '';
    this.maxRecipes = data.maxRecipes ?? 0;
    this.maxKits = data.maxKits ?? 0;
    this.maxDevices = data.maxDevices ?? 0;
  }
}
