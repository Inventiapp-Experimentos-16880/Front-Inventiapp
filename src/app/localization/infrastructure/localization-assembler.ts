import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Localization } from '../domain/model/localization.entity';

import {
  LocalizationResource,
  LocalizationResponse
} from './localization-response';

/**
 * Converts localization API resources into domain entities
 * and vice versa.
 */
export class LocalizationAssembler
  implements BaseAssembler<
    Localization,
    LocalizationResource,
    LocalizationResponse
  > {

  /**
   * Converts an API resource into a domain entity.
   *
   * @param resource localization API resource
   * @returns localization domain entity
   */
  toEntityFromResource(
    resource: LocalizationResource
  ): Localization {
    return new Localization({
      id: String(
        resource.id ?? 'current-localization'
      ),
      countryCode: resource.countryCode,
      recommendedLanguage:
      resource.recommendedLanguage,
      source: resource.source
    });
  }

  /**
   * Converts a domain entity into an API resource.
   *
   * @param entity localization domain entity
   * @returns localization API resource
   */
  toResourceFromEntity(
    entity: Localization
  ): LocalizationResource {
    return {
      id: entity.id,
      countryCode: entity.countryCode,
      recommendedLanguage:
      entity.recommendedLanguage,
      source: entity.source
    };
  }

  /**
   * Converts the API response into an entity collection.
   *
   * @param response localization API response
   * @returns collection containing the localization entity
   */
  toEntitiesFromResponse(
    response: LocalizationResponse
  ): Localization[] {
    return [
      this.toEntityFromResource(response)
    ];
  }
}
