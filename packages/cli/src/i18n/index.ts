/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Settings } from '../config/settingsSchema.js';
import en from './en.json' assert { type: 'json' };
import tr from './tr.json' assert { type: 'json' };

const translations = { en, tr } as const;

export type SupportedLocale = keyof typeof translations;
type TranslationKey = keyof typeof en;

export interface TranslationOptions {
  locale?: string;
  settings?: Settings;
}

function normalizeLocale(locale?: string): SupportedLocale {
  const normalized = locale?.toLowerCase().split('-')[0];
  if (normalized && normalized in translations) {
    return normalized as SupportedLocale;
  }
  return 'en';
}

export function getLocale(options?: TranslationOptions): SupportedLocale {
  const localeFromEnv = process.env['GEMINI_CLI_LOCALE'];
  const requestedLocale =
    options?.locale || options?.settings?.general?.locale || localeFromEnv;
  return normalizeLocale(requestedLocale);
}

export function t(key: TranslationKey, options?: TranslationOptions): string {
  const locale = getLocale(options);
  return translations[locale][key] ?? translations['en'][key] ?? key;
}
