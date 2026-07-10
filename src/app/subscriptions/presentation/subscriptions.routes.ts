import { Routes } from '@angular/router';

const pricingPlans = () =>
  import('./views/plans/plans-view').then((m) => m.PlansView);

const checkoutSuccess = () =>
  import('./views/success/checkout-success-view').then((m) => m.CheckoutSuccessView);

const checkoutCancel = () =>
  import('./views/cancel/checkout-cancel-view').then((m) => m.CheckoutCancelView);

export const subscriptionsRoutes: Routes = [
  { path: 'plans', loadComponent: pricingPlans, title: 'Pricing plans' },
  { path: 'success', loadComponent: checkoutSuccess, title: 'Success payment' },
  { path: 'cancel', loadComponent: checkoutCancel, title: 'Canceled payment' },
];
