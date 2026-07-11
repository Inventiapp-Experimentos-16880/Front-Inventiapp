import { HttpClient } from '@angular/common/http';

import {
  catchError,
  map,
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Localization } from '../domain/model/localization.entity';

import { LocalizationAssembler } from './localization-assembler';

import {
  LocalizationResource,
  LocalizationResponse
} from './localization-response';

/**
 * Endpoint responsible for obtaining the current
 * localization recommendation.
 */
export class LocalizationApiEndpoint
  extends BaseApiEndpoint<
    Localization,
    LocalizationResource,
    LocalizationResponse,
    LocalizationAssembler
  > {

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}` +
      `${environment.platformProviderLocalizationEndpointPath}`,
      new LocalizationAssembler()
    );
  }

  /**
   * Gets the localization recommendation based on the
   * client's public IP.
   *
   * @returns localization domain entity
   */
  getLocalization(): Observable<Localization> {
    return this.http
      .get<LocalizationResponse>(
        this.endpointUrl
      )
      .pipe(
        map(response =>
          this.assembler
            .toEntityFromResource(response)
        ),
        catchError(
          this.handleError(
            'Failed to detect localization'
          )
        )
      );
  }
}
