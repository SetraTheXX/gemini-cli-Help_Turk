/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { debugLogger } from '@google/gemini-cli-core';

const LOCALE_ENV_KEYS = ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const;

/**
 * Normalize locale strings from environment variables or CLI flags.
 *
 * Examples:
 * - "tr_TR.UTF-8" -> "tr-TR"
 * - "en_US" -> "en-US"
 * - "fr" -> "fr"
 *
 * @param locale Raw locale string (may include encoding suffixes).
 * @returns Normalized locale or `undefined` when invalid.
 */
export function normalizeLocale(locale?: string | null): string | undefined {
  if (!locale) {
    return undefined;
  }

  const trimmed = locale.trim();
  if (!trimmed) {
    return undefined;
  }

  const [withoutEncoding] = trimmed.split('.');
  const normalizedSeparators = withoutEncoding.replace(/_/g, '-');
  const localePattern = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2})?$/;

  if (!localePattern.test(normalizedSeparators)) {
    debugLogger.warn('Invalid locale provided', { locale: trimmed });
    return undefined;
  }

  const [language, region] = normalizedSeparators.split('-');
  const normalized = region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase();

  return normalized;
}

/**
 * Detect the preferred locale from the process environment.
 * Priority: LC_ALL > LC_MESSAGES > LANG > fallback.
 */
export function detectLocale(
  env: NodeJS.ProcessEnv,
  fallback: string = 'en',
): string {
  for (const key of LOCALE_ENV_KEYS) {
    const normalized = normalizeLocale(env[key]);
    if (normalized) {
      return normalized;
    }
  }

  return normalizeLocale(fallback) ?? 'en';
}

/**
 * Validate and normalize a locale string, throwing on invalid values.
 */
export function validateLocale(locale?: string): string {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    throw new Error(
      locale?.trim()
        ? `Invalid locale value: ${locale}`
        : 'Invalid locale value: expected a non-empty string',
    );
  }

  return normalized;
}
