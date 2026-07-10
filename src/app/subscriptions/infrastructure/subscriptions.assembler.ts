import { Injectable } from '@angular/core';
import { PlanEntity } from '../domain/model/plan.entity';
import { SubscriptionEntity } from '../domain/model/subscription.entity';
import { PlanResource, SubscriptionResource } from './subscriptions.response';

@Injectable({ providedIn: 'root' })
export class SubscriptionsAssembler {
  toPlanEntity(resource: PlanResource): PlanEntity {
    return new PlanEntity({
      id: resource.id,
      name: resource.name,
      description: resource.description,
      price: resource.price,
      currency: resource.currency,
      billingInterval: resource.billingInterval,
      stripePriceId: resource.stripePriceId,
      maxRecipes: resource.maxRecipes,
      maxKits: resource.maxKits,
      maxDevices: resource.maxDevices,
    });
  }

  toSubscriptionEntity(resource: SubscriptionResource): SubscriptionEntity {
    return new SubscriptionEntity({
      id: resource.id,
      accountId: resource.accountId,
      planId: resource.planId,
      planName: resource.planName,
      planPrice: resource.planPrice,
      stripeSubscriptionId: resource.stripeSubscriptionId,
      status: resource.status,
      currentPeriodEnd: resource.currentPeriodEnd,
      cancelAtPeriodEnd: resource.cancelAtPeriodEnd,
      maxRecipes: resource.maxRecipes,
      maxKits: resource.maxKits,
      maxDevices: resource.maxDevices,
    });
  }
}
