import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionsStore } from '../../../application/subscriptions.store';
import { AuthStore } from '../../../../auth/application/auth.store';

@Component({
  selector: 'app-plans-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './plans-view.html',
  styleUrl: './plans-view.css',
})
export class PlansView implements OnInit {
  protected readonly store = inject(SubscriptionsStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected isOnboarding = false;

  // Requirement 1: Real Savings from Resolved Alerts
  protected realSavings = 450;
  protected realSavingsMultiplier = 4.1; // 450 / 108 (Pro Subscription cost in PEN)
  protected resolvedAlerts = [
    { product: 'Leche Gloria', quantity: 10, amount: 35.00, date: '2026-07-10' },
    { product: 'Arroz Costeño', quantity: 15, amount: 60.00, date: '2026-07-08' },
    { product: 'Aceite Primor', quantity: 5, amount: 35.00, date: '2026-07-05' }
  ];

  // Requirement 2: Potential Savings Simulator
  protected monthlyInventory = 8000;
  protected currentMermaPercent = 6;

  get lossWithoutInventiapp(): number {
    return this.monthlyInventory * (this.currentMermaPercent / 100) * 12;
  }

  get lossWithInventiapp(): number {
    // 75% reduction in waste due to smart tracking and alerts
    return this.lossWithoutInventiapp * 0.25;
  }

  get potentialSavings(): number {
    return this.lossWithoutInventiapp - this.lossWithInventiapp;
  }

  get potentialNetSavings(): number {
    // Pro Subscription cost is $29/mo -> S/. 108.75/mo (approx S/. 1,305/yr at 3.75 rate)
    const annualProCost = 29 * 3.75 * 12;
    return Math.max(0, this.potentialSavings - annualProCost);
  }

  onInventoryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.monthlyInventory = Number(target.value);
  }

  onMermaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentMermaPercent = Number(target.value);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isOnboarding = params['onboarding'] === 'true';
    });
    this.store.loadPlans();
    const currentUser = this.authStore.currentUser();
    if (currentUser) {
      const ownerId = currentUser.ownerId || currentUser.id;
      if (ownerId) {
        this.store.loadSubscriptionStatus(String(ownerId));
      }
    }
  }

  selectPlan(planId: string): void {
    const currentUser = this.authStore.currentUser();
    if (!currentUser) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    const ownerId = currentUser.ownerId || currentUser.id;
    if (ownerId) {
      this.store.subscribeToPlan(String(ownerId), planId, this.isOnboarding);
    }
  }

  goBack(): void {
    void this.router.navigate(['/configuracion']);
  }

  continueWithFreePlan(): void {
    this.authStore.logout();
  }
}
