import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PlanEntity } from '../domain/model/plan.entity';
import { SubscriptionEntity } from '../domain/model/subscription.entity';
import { SubscriptionsAssembler } from './subscriptions.assembler';
import { PlanResource, SubscriptionResource, CheckoutSessionResponse } from './subscriptions.response';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiEndpoint {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(SubscriptionsAssembler);
  private readonly baseUrl = environment.platformProviderApiBaseUrl;

  getPlans(): Observable<PlanEntity[]> {
    return this.http.get<PlanResource[]>(`${this.baseUrl}/plans`).pipe(
      map(resources => resources.map(res => this.assembler.toPlanEntity(res)))
    );
  }

  getSubscriptionStatus(accountId: string): Observable<SubscriptionEntity> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.get<SubscriptionResource>(`${this.baseUrl}/subscriptions`, { params }).pipe(
      map(res => this.assembler.toSubscriptionEntity(res))
    );
  }

  createCheckoutSession(accountId: string, planId: string, onboarding?: boolean): Observable<string> {
    return this.http.post<CheckoutSessionResponse>(`${this.baseUrl}/subscriptions/checkout-session`, {
      accountId,
      planId,
      onboarding: !!onboarding
    }).pipe(
      map(res => res.sessionUrl)
    );
  }

  getInvoices(accountId: string): Observable<any[]> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.get<any[]>(`${this.baseUrl}/subscriptions/invoices`, { params });
  }
}
