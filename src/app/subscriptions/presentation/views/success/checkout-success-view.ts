import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../../auth/application/auth.store';

@Component({
  selector: 'app-checkout-success-view',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './checkout-success-view.html',
  styleUrl: './checkout-success-view.css',
})
export class CheckoutSuccessView implements OnInit {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  protected isOnboarding = false;

  ngOnInit(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    this.isOnboarding = urlTree.queryParams['onboarding'] === 'true';

    // Automatically redirect back after 5 seconds
    setTimeout(() => {
      this.continueToApp();
    }, 5000);
  }

  continueToApp(): void {
    if (this.isOnboarding) {
      this.authStore.logout();
    } else {
      void this.router.navigate(['/configuracion']);
    }
  }
}
