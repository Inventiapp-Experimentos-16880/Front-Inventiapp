import { Injectable, inject, signal } from '@angular/core';
import { SubscriptionsApiEndpoint } from '../infrastructure/subscriptions-api-endpoint';
import { PlanEntity } from '../domain/model/plan.entity';
import { SubscriptionEntity } from '../domain/model/subscription.entity';

@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private readonly api = inject(SubscriptionsApiEndpoint);

  readonly plans = signal<PlanEntity[]>([]);
  readonly activeSubscription = signal<SubscriptionEntity | null>(null);

  // Separate loading/error signals for plans vs subscription status
  readonly plansLoading = signal(false);
  readonly plansError = signal<string | null>(null);

  readonly subscriptionLoading = signal(false);

  // Keep a generic loading signal for backwards compatibility (used by plans-view)
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  loadPlans(): void {
    this.plansLoading.set(true);
    this.loading.set(true);
    this.plansError.set(null);
    this.error.set(null);
    this.api.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.plansLoading.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        this.plansError.set(err.message ?? 'Failed to load plans');
        this.error.set(err.message ?? 'Failed to load plans');
        this.plansLoading.set(false);
        this.loading.set(false);
      }
    });
  }

  loadSubscriptionStatus(accountId: string): void {
    if (!accountId) return;
    this.subscriptionLoading.set(true);
    this.api.getSubscriptionStatus(accountId).subscribe({
      next: (sub) => {
        this.activeSubscription.set(sub);
        this.subscriptionLoading.set(false);
      },
      error: () => {
        // Subscription might not exist yet for new accounts — not an error
        this.activeSubscription.set(null);
        this.subscriptionLoading.set(false);
      }
    });
  }

  subscribeToPlan(accountId: string, planId: string, onboarding?: boolean): void {
     this.saving.set(true);
     this.error.set(null);
     this.api.createCheckoutSession(accountId, planId, onboarding).subscribe({
       next: (sessionUrl) => {
         this.saving.set(false);
         // Redirect to Stripe checkout page
         window.location.href = sessionUrl;
       },
       error: (err) => {
         this.error.set(err.message ?? 'Failed to initiate checkout session');
         this.saving.set(false);
       }
     });
   }

  readonly invoices = signal<any[]>([]);
  readonly invoicesLoading = signal(false);

  loadInvoices(accountId: string): void {
    if (!accountId) return;
    this.invoicesLoading.set(true);
    this.api.getInvoices(accountId).subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.invoicesLoading.set(false);
      },
      error: () => {
        this.invoices.set([]);
        this.invoicesLoading.set(false);
      }
    });
  }
}
