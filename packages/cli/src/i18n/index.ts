/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type MessageBundle = Record<string, string>;

const SUPPORTED_LOCALES = ['en', 'tr'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: SupportedLocale = 'en';

const localesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'locales',
);

let activeLocale: SupportedLocale = DEFAULT_LOCALE;
const messageCache: Partial<Record<SupportedLocale, MessageBundle>> = {};

function normalizeLocale(locale?: string): SupportedLocale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }
  const normalized = locale.toLowerCase().replace('_', '-');
  const matchedLocale = SUPPORTED_LOCALES.find(
    (supported) =>
      normalized === supported || normalized.startsWith(`${supported}-`),
  );

  return matchedLocale ?? DEFAULT_LOCALE;
}

function loadBundle(locale: SupportedLocale): MessageBundle {
  if (messageCache[locale]) {
    return messageCache[locale]!;
  }

  const candidatePath = path.join(localesDir, `${locale}.json`);
  const fallbackPath = path.join(localesDir, `${DEFAULT_LOCALE}.json`);

  try {
    if (existsSync(candidatePath)) {
      const bundle = JSON.parse(readFileSync(candidatePath, 'utf-8')) as MessageBundle;
      messageCache[locale] = bundle;
      return bundle;
    }
  } catch (error) {
    console.warn(
      `Unable to load locale file for ${locale}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const fallbackBundle = JSON.parse(readFileSync(fallbackPath, 'utf-8')) as MessageBundle;
  messageCache[DEFAULT_LOCALE] = fallbackBundle;
  return fallbackBundle;
}

export function detectPreferredLocale(): string | undefined {
  return (
    process.env['GEMINI_CLI_LOCALE'] ||
    process.env['LC_ALL'] ||
    process.env['LANG'] ||
    Intl.DateTimeFormat().resolvedOptions().locale
  );
}

export function initializeI18n(localeHint?: string) {
  activeLocale = normalizeLocale(localeHint);
  const bundle = loadBundle(activeLocale);

  return { locale: activeLocale, bundle };
}

export function translate(key: string): string {
  const bundle = messageCache[activeLocale] ?? loadBundle(activeLocale);
  if (bundle[key]) {
    return bundle[key];
  }

  const fallbackBundle =
    messageCache[DEFAULT_LOCALE] ?? loadBundle(DEFAULT_LOCALE);

  if (fallbackBundle[key]) {
    return fallbackBundle[key];
  }

  return key;
}

export function getActiveLocale(): SupportedLocale {
  return activeLocale;
}

export function getSupportedLocales(): SupportedLocale[] {
  return [...SUPPORTED_LOCALES];
}
