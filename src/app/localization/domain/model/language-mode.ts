/**
 * Available language selection modes.
 */
export const LANGUAGE_MODES = [
  'manual',
  'location'
] as const;

/**
 * Defines whether the active language comes from the user's
 * manual choice or from the location recommendation.
 */
export type LanguageMode =
  (typeof LANGUAGE_MODES)[number];

/**
 * Checks whether a value is a valid language mode.
 *
 * @param value value to validate
 * @returns true when the mode is valid
 */
export function isLanguageMode(
  value: string | null
): value is LanguageMode {
  return (
    value !== null &&
    LANGUAGE_MODES.some(mode => mode === value)
  );
}
