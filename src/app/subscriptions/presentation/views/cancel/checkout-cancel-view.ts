import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout-cancel-view',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './checkout-cancel-view.html',
  styleUrl: '../success/checkout-success-view.css', // Reuse success view styling
})
export class CheckoutCancelView {
  private readonly router = inject(Router);

  tryAgain(): void {
    void this.router.navigate(['/subscriptions/plans']);
  }

  cancel(): void {
    void this.router.navigate(['/configuracion']);
  }
}
