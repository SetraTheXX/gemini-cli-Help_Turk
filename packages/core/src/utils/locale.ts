/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

let cachedUserLocale: string | null | undefined;

/**
 * Reset the cached locale. Intended for tests to ensure each scenario
 * re-runs detection logic with a clean slate.
 */
export function resetUserLocaleCache(): void {
  cachedUserLocale = undefined;
}

/**
 * Detect the user's locale from common environment variables or the
 * runtime's Intl configuration. The value is normalized so that language
 * codes are lowercase and region codes (when present) are uppercase and
 * separated with an underscore (e.g., `tr`, `en_US`).
 */
export function getUserLocale(): string | null {
  if (cachedUserLocale !== undefined) {
    return cachedUserLocale;
  }

  const locale =
    normalizeLocale(process.env['LC_ALL']) ||
    normalizeLocale(process.env['LC_CTYPE']) ||
    normalizeLocale(process.env['LANG']) ||
    normalizeLocale(getIntlLocale());

  cachedUserLocale = locale ?? null;
  return cachedUserLocale;
}

function getIntlLocale(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? null;
  } catch (_error) {
    return null;
  }
}

function normalizeLocale(locale: string | undefined | null): string | null {
  if (!locale) {
    return null;
  }

  // Drop encoding segments like ".UTF-8"
  const baseLocale = locale.split('.')[0]?.trim();
  if (!baseLocale) {
    return null;
  }

  const parts = baseLocale.replace(/-/g, '_').split('_').filter(Boolean);
  const [language, region] = parts;

  if (!language) {
    return null;
  }

  const normalizedLanguage = language.toLowerCase();
  return region ? `${normalizedLanguage}_${region.toUpperCase()}` : normalizedLanguage;
}
