import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Localization } from '../domain/model/localization.entity';

import { LocalizationApiEndpoint } from './localization-api-endpoint';

/**
 * API service for the localization bounded context.
 */
@Injectable({
  providedIn: 'root'
})
export class LocalizationApi extends BaseApi {

  private readonly localizationEndpoint:
    LocalizationApiEndpoint;

  constructor(http: HttpClient) {
    super();

    this.localizationEndpoint =
      new LocalizationApiEndpoint(http);
  }

  /**
   * Gets the current localization recommendation.
   *
   * @returns localization domain entity
   */
  getLocalization(): Observable<Localization> {
    return this.localizationEndpoint
      .getLocalization();
  }
}
