import {
  computed,
  Injectable,
  signal
} from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import {
  isLanguageCode,
  LanguageCode,
  SUPPORTED_LANGUAGE_CODES
} from '../domain/model/language-code';

import {
  isLanguageMode,
  LanguageMode
} from '../domain/model/language-mode';

import { Localization } from '../domain/model/localization.entity';
import { LocalizationSource } from '../domain/model/localization-source';

import { LocalizationApi } from '../infrastructure/localization-api';

/**
 * Structure used to cache the localization recommendation.
 */
interface StoredLocalization {
  countryCode: string | null;
  recommendedLanguage: LanguageCode;
  source: LocalizationSource;
  expiresAt: number;
}

/**
 * Store responsible for managing the application language.
 *
 * It keeps the manually selected language separate from the
 * language recommended according to the user's public IP.
 */
@Injectable({
  providedIn: 'root'
})
export class LocalizationStore {

  private static readonly LEGACY_LANGUAGE_STORAGE_KEY =
    'stocktrack_language';

  private static readonly MANUAL_LANGUAGE_STORAGE_KEY =
    'stocktrack_manual_language';

  private static readonly LANGUAGE_MODE_STORAGE_KEY =
    'stocktrack_language_mode';

  private static readonly LOCATION_CACHE_STORAGE_KEY =
    'stocktrack_location_cache';

  private static readonly LOCATION_CACHE_DURATION =
    24 * 60 * 60 * 1000;

  private readonly manualLanguageSignal =
    signal<LanguageCode>('es');

  private readonly languageModeSignal =
    signal<LanguageMode>('manual');

  private readonly activeLanguageSignal =
    signal<LanguageCode>('es');

  private readonly localizationSignal =
    signal<Localization | null>(null);

  private readonly loadingSignal =
    signal<boolean>(false);

  private readonly initializedSignal =
    signal<boolean>(false);

  private readonly errorSignal =
    signal<string | null>(null);

  private initializationStarted = false;

  /**
   * Read-only state exposed to the components.
   */
  readonly manualLanguage =
    this.manualLanguageSignal.asReadonly();

  readonly languageMode =
    this.languageModeSignal.asReadonly();

  readonly activeLanguage =
    this.activeLanguageSignal.asReadonly();

  readonly localization =
    this.localizationSignal.asReadonly();

  readonly loading =
    this.loadingSignal.asReadonly();

  readonly initialized =
    this.initializedSignal.asReadonly();

  readonly error =
    this.errorSignal.asReadonly();

  /**
   * Language recommended according to the detected country.
   */
  readonly locationLanguage = computed<LanguageCode | null>(
    () => this.localization()?.recommendedLanguage ?? null
  );

  /**
   * Country detected by the backend.
   */
  readonly countryCode = computed<string | null>(
    () => this.localization()?.countryCode ?? null
  );

  /**
   * Indicates whether a real IP recommendation is available.
   *
   * A FALLBACK response is not considered a location recommendation.
   */
  readonly hasLocationRecommendation = computed<boolean>(
    () => this.localization()?.source === 'IP'
  );

  constructor(
    private readonly localizationApi: LocalizationApi,
    private readonly translate: TranslateService
  ) {
  }

  /**
   * Initializes the language state once.
   *
   * The manually selected language is applied immediately while
   * the location recommendation is loaded in the background.
   */
  initialize(): void {
    if (this.initializationStarted) {
      return;
    }

    this.initializationStarted = true;
    this.errorSignal.set(null);

    this.translate.addLangs(
      [...SUPPORTED_LANGUAGE_CODES]
    );

    const manualLanguage =
      this.readManualLanguage();

    const savedMode =
      this.readLanguageMode();

    const cachedLocalization =
      this.readCachedLocalization();

    this.manualLanguageSignal.set(manualLanguage);
    this.languageModeSignal.set(savedMode);

    if (cachedLocalization) {
      this.localizationSignal.set(cachedLocalization);
    }

    if (
      savedMode === 'location' &&
      cachedLocalization?.source === 'IP'
    ) {
      this.applyLanguage(
        cachedLocalization.recommendedLanguage
      );
    } else {
      /*
       * The manual language is used temporarily if the location
       * recommendation has not been obtained yet.
       */
      this.applyLanguage(manualLanguage);
    }

    if (cachedLocalization) {
      this.initializedSignal.set(true);
      return;
    }

    this.loadLocationRecommendation();
  }

  /**
   * Changes and stores the manually selected language.
   *
   * Selecting a manual language also activates manual mode.
   *
   * @param language selected language
   */
  selectManualLanguage(language: LanguageCode): void {
    this.manualLanguageSignal.set(language);
    this.languageModeSignal.set('manual');

    this.safeSetItem(
      LocalizationStore.MANUAL_LANGUAGE_STORAGE_KEY,
      language
    );

    this.safeSetItem(
      LocalizationStore.LANGUAGE_MODE_STORAGE_KEY,
      'manual'
    );

    this.applyLanguage(language);
  }

  /**
   * Activates the previously selected manual language.
   */
  useManualLanguage(): void {
    this.languageModeSignal.set('manual');

    this.safeSetItem(
      LocalizationStore.LANGUAGE_MODE_STORAGE_KEY,
      'manual'
    );

    this.applyLanguage(
      this.manualLanguageSignal()
    );
  }

  /**
   * Activates the language recommended according to the IP.
   *
   * Nothing is changed when a real location recommendation
   * is not available.
   */
  useLocationLanguage(): void {
    const localization = this.localizationSignal();

    if (!localization || localization.source !== 'IP') {
      return;
    }

    this.languageModeSignal.set('location');

    this.safeSetItem(
      LocalizationStore.LANGUAGE_MODE_STORAGE_KEY,
      'location'
    );

    this.applyLanguage(
      localization.recommendedLanguage
    );
  }

  /**
   * Forces a new request to detect the current location.
   *
   * This can be used when the user believes their location
   * has changed.
   */
  refreshLocationRecommendation(): void {
    this.safeRemoveItem(
      LocalizationStore.LOCATION_CACHE_STORAGE_KEY
    );

    this.loadLocationRecommendation();
  }

  /**
   * Requests the localization recommendation from the backend.
   */
  private loadLocationRecommendation(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.localizationApi.getLocalization().subscribe({
      next: (localization: Localization) => {
        this.localizationSignal.set(localization);

        if (localization.source === 'IP') {
          this.saveLocalizationCache(localization);

          if (this.languageModeSignal() === 'location') {
            this.applyLanguage(
              localization.recommendedLanguage
            );
          }
        } else if (
          this.languageModeSignal() === 'location'
        ) {
          /*
           * A FALLBACK response is not a real location result.
           * The manual language remains active.
           */
          this.applyLanguage(
            this.manualLanguageSignal()
          );
        }

        this.loadingSignal.set(false);
        this.initializedSignal.set(true);
      },

      error: (error: unknown) => {
        console.error(
          'Could not load localization recommendation:',
          error
        );

        this.errorSignal.set(
          'Could not detect the language by location'
        );

        if (this.languageModeSignal() === 'location') {
          this.applyLanguage(
            this.manualLanguageSignal()
          );
        }

        this.loadingSignal.set(false);
        this.initializedSignal.set(true);
      }
    });
  }

  /**
   * Applies a language using ngx-translate.
   *
   * @param language language to apply
   */
  private applyLanguage(language: LanguageCode): void {
    this.activeLanguageSignal.set(language);
    this.translate.use(language);

    document.documentElement.lang = language;
  }

  /**
   * Reads the manually selected language.
   *
   * It also migrates the value used by the old language switcher.
   */
  private readManualLanguage(): LanguageCode {
    const currentLanguage = this.safeGetItem(
      LocalizationStore.MANUAL_LANGUAGE_STORAGE_KEY
    );

    if (isLanguageCode(currentLanguage)) {
      return currentLanguage;
    }

    const legacyLanguage = this.safeGetItem(
      LocalizationStore.LEGACY_LANGUAGE_STORAGE_KEY
    );

    if (isLanguageCode(legacyLanguage)) {
      this.safeSetItem(
        LocalizationStore.MANUAL_LANGUAGE_STORAGE_KEY,
        legacyLanguage
      );

      this.safeRemoveItem(
        LocalizationStore.LEGACY_LANGUAGE_STORAGE_KEY
      );

      return legacyLanguage;
    }

    return 'es';
  }

  /**
   * Reads the previously selected language mode.
   */
  private readLanguageMode(): LanguageMode {
    const savedMode = this.safeGetItem(
      LocalizationStore.LANGUAGE_MODE_STORAGE_KEY
    );

    return isLanguageMode(savedMode)
      ? savedMode
      : 'manual';
  }

  /**
   * Reads a valid non-expired localization cache.
   */
  private readCachedLocalization(): Localization | null {
    const cachedValue = this.safeGetItem(
      LocalizationStore.LOCATION_CACHE_STORAGE_KEY
    );

    if (!cachedValue) {
      return null;
    }

    try {
      const cached =
        JSON.parse(cachedValue) as StoredLocalization;

      const isExpired =
        !cached.expiresAt ||
        cached.expiresAt <= Date.now();

      const hasValidLanguage =
        isLanguageCode(cached.recommendedLanguage);

      const hasValidSource =
        cached.source === 'IP';

      if (
        isExpired ||
        !hasValidLanguage ||
        !hasValidSource
      ) {
        this.safeRemoveItem(
          LocalizationStore.LOCATION_CACHE_STORAGE_KEY
        );

        return null;
      }

      return new Localization({
        id: 'cached-localization',
        countryCode: cached.countryCode,
        recommendedLanguage:
        cached.recommendedLanguage,
        source: cached.source
      });

    } catch {
      this.safeRemoveItem(
        LocalizationStore.LOCATION_CACHE_STORAGE_KEY
      );

      return null;
    }
  }

  /**
   * Saves the detected location for 24 hours.
   */
  private saveLocalizationCache(
    localization: Localization
  ): void {
    const cache: StoredLocalization = {
      countryCode: localization.countryCode,
      recommendedLanguage:
      localization.recommendedLanguage,
      source: localization.source,
      expiresAt:
        Date.now() +
        LocalizationStore.LOCATION_CACHE_DURATION
    };

    this.safeSetItem(
      LocalizationStore.LOCATION_CACHE_STORAGE_KEY,
      JSON.stringify(cache)
    );
  }

  /**
   * Safely reads a localStorage value.
   */
  private safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Safely saves a localStorage value.
   */
  private safeSetItem(
    key: string,
    value: string
  ): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /*
       * The application can continue even when browser storage
       * is disabled or unavailable.
       */
    }
  }

  /**
   * Safely removes a localStorage value.
   */
  private safeRemoveItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /*
       * The application can continue without localStorage.
       */
    }
  }
}
