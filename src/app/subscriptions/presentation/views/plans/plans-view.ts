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
