import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class SubscriptionEntity implements BaseEntity {
  id: string;
  accountId: string;
  planId: string;
  planName: string;
  planPrice: number;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  maxRecipes: number;
  maxKits: number;
  maxDevices: number;

  constructor(data: Partial<SubscriptionEntity>) {
    this.id = data.id ?? '';
    this.accountId = data.accountId ?? '';
    this.planId = data.planId ?? '';
    this.planName = data.planName ?? '';
    this.planPrice = data.planPrice ?? 0;
    this.stripeSubscriptionId = data.stripeSubscriptionId ?? '';
    this.status = data.status ?? 'INACTIVE';
    this.currentPeriodEnd = data.currentPeriodEnd ?? '';
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd ?? false;
    this.maxRecipes = data.maxRecipes ?? 0;
    this.maxKits = data.maxKits ?? 0;
    this.maxDevices = data.maxDevices ?? 0;
  }
}
