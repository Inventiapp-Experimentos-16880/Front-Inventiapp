import {
  BaseResource,
  BaseResponse
} from '../../shared/infrastructure/base-response';

import { LanguageCode } from '../domain/model/language-code';
import { LocalizationSource } from '../domain/model/localization-source';

/**
 * Resource returned by GET /api/v1/localization.
 */
export interface LocalizationResource
  extends BaseResource {

  countryCode: string | null;
  recommendedLanguage: LanguageCode;
  source: LocalizationSource;
}

/**
 * API response returned by the localization endpoint.
 */
export interface LocalizationResponse
  extends BaseResponse, LocalizationResource {
}
