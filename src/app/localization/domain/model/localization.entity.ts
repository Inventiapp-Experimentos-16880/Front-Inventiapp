import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { LanguageCode } from './language-code';
import { LocalizationSource } from './localization-source';

/**
 * Represents the localization recommendation returned by the backend.
 */
export class Localization implements BaseEntity {

  constructor(localization: {
    id: string;
    countryCode: string | null;
    recommendedLanguage: LanguageCode;
    source: LocalizationSource;
  }) {
    this._id = localization.id;
    this._countryCode = localization.countryCode;
    this._recommendedLanguage =
      localization.recommendedLanguage;
    this._source = localization.source;
  }

  private _id: string;

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  private _countryCode: string | null;

  get countryCode(): string | null {
    return this._countryCode;
  }

  set countryCode(value: string | null) {
    this._countryCode = value;
  }

  private _recommendedLanguage: LanguageCode;

  get recommendedLanguage(): LanguageCode {
    return this._recommendedLanguage;
  }

  set recommendedLanguage(value: LanguageCode) {
    this._recommendedLanguage = value;
  }

  private _source: LocalizationSource;

  get source(): LocalizationSource {
    return this._source;
  }

  set source(value: LocalizationSource) {
    this._source = value;
  }
}
