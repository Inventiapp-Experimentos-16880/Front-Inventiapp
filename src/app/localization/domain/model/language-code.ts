/**
 * Language codes supported by the StockTrack frontend.
 */
export const SUPPORTED_LANGUAGE_CODES = [
  'es',
  'en',
  'de',
  'fr',
  'pt',
  'it',
  'ja'
] as const;

/**
 * Union type generated from the supported language codes.
 */
export type LanguageCode =
  (typeof SUPPORTED_LANGUAGE_CODES)[number];

/**
 * Checks whether a value is a supported language code.
 *
 * @param value value to validate
 * @returns true when the value is supported
 */
export function isLanguageCode(
  value: string | null
): value is LanguageCode {
  return (
    value !== null &&
    SUPPORTED_LANGUAGE_CODES.some(
      language => language === value
    )
  );
}
