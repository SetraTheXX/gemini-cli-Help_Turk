/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import en from './messages/en.json' assert { type: 'json' };
import tr from './messages/tr.json' assert { type: 'json' };

type Locale = 'en' | 'tr';

type Messages = Record<string, string>;

const catalogs: Record<Locale, Messages> = {
  en,
  tr,
};

const DEFAULT_LOCALE: Locale = 'en';

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }

  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const catalog = catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
  const fallbackCatalog = catalogs[DEFAULT_LOCALE];
  const template = catalog[key] ?? fallbackCatalog[key] ?? key;
  return interpolate(template, vars);
}
