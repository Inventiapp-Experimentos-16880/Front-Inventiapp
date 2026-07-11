import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class AccountEntity implements BaseEntity {
  id: string;
  accountId: string;
  email: string;
  stripeCustomerId: string | null;
  status: string;
  currentPlanId: string | null;

  constructor(data: Partial<AccountEntity>) {
    this.id = data.id ?? '';
    this.accountId = data.accountId ?? '';
    this.email = data.email ?? '';
    this.stripeCustomerId = data.stripeCustomerId ?? null;
    this.status = data.status ?? 'INACTIVE';
    this.currentPlanId = data.currentPlanId ?? null;
  }
}
