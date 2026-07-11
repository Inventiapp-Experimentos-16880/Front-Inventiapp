import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  LocalizationStore
} from '../../../../localization/application/localization.store';

import {
  LanguageCode,
  SUPPORTED_LANGUAGE_CODES
} from '../../../../localization/domain/model/language-code';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslateModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {

  protected readonly localizationStore =
    inject(LocalizationStore);

  protected readonly languages =
    SUPPORTED_LANGUAGE_CODES;

  /**
   * Activates the language selected manually.
   */
  protected useManualLanguage(): void {
    this.localizationStore.useManualLanguage();
  }

  /**
   * Selects, stores and activates a manual language.
   *
   * @param language selected language
   */
  protected selectManualLanguage(
    language: LanguageCode
  ): void {
    this.localizationStore
      .selectManualLanguage(language);
  }

  /**
   * Activates the language recommended by location.
   */
  protected useLocationLanguage(): void {
    this.localizationStore.useLocationLanguage();
  }

  /**
   * Requests a new location recommendation.
   */
  protected refreshLocation(): void {
    this.localizationStore
      .refreshLocationRecommendation();
  }

  /**
   * Returns the localized name of a language.
   *
   * Examples:
   * es → Español
   * en → Inglés
   * de → Alemán
   */
  protected getLanguageName(
    language: LanguageCode
  ): string {
    try {
      return new Intl.DisplayNames(
        [this.localizationStore.activeLanguage()],
        { type: 'language' }
      ).of(language) ?? language.toUpperCase();
    } catch {
      return language.toUpperCase();
    }
  }

  /**
   * Returns the localized name of the detected country.
   *
   * Examples:
   * PE → Perú
   * DE → Alemania
   */
  protected getCountryName(): string {
    const countryCode =
      this.localizationStore.countryCode();

    if (!countryCode) {
      return '';
    }

    try {
      return new Intl.DisplayNames(
        [this.localizationStore.activeLanguage()],
        { type: 'region' }
      ).of(countryCode) ?? countryCode;
    } catch {
      return countryCode;
    }
  }
}
