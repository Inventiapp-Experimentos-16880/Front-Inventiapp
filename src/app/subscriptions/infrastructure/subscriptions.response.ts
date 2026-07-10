export interface PlanResource {
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
}

export interface SubscriptionResource {
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
}

export interface CheckoutSessionResponse {
  sessionUrl: string;
}
