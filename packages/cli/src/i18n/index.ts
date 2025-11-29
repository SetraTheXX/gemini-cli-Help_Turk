/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import process from 'node:process';
import { en, type EnLocale } from './locales/en.js';
import { tr, type TrLocale } from './locales/tr.js';

type Locale = 'en' | 'tr';

type Messages = EnLocale & TrLocale;

type NestedValue = string | Record<string, NestedValue>;

type LocaleTree = Record<string, NestedValue>;

const locales: Record<Locale, LocaleTree> = {
  en,
  tr,
};

const DEFAULT_LOCALE: Locale = 'en';

function parseLocale(value: string | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith('tr')) {
    return 'tr';
  }

  return DEFAULT_LOCALE;
}

let activeLocale: Locale = parseLocale(process.env.GEMINI_CLI_LANG);

function getFromPath(tree: LocaleTree, path: string): string | undefined {
  return path.split('.').reduce<NestedValue | undefined>((current, segment) => {
    if (typeof current === 'object' && current !== null) {
      return (current as Record<string, NestedValue>)[segment];
    }
    return undefined;
  }, tree) as string | undefined;
}

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getLocale(): Locale {
  return activeLocale;
}

export function t(path: string): string {
  const localeTree = locales[activeLocale] ?? locales[DEFAULT_LOCALE];
  const localized = getFromPath(localeTree, path);
  if (typeof localized === 'string') {
    return localized;
  }

  const fallback = getFromPath(locales[DEFAULT_LOCALE], path);
  if (typeof fallback === 'string') {
    return fallback;
  }

  return path;
}

export type { Locale, Messages };
