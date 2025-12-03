/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import en from './messages/en.json';
import tr from './messages/tr.json';

const catalogs = { en, tr } as const;

export type MessageKey = string;

export type TemplateValues = Record<string, string | number>;

type NestedMessages = Record<string, string | NestedMessages>;

type CatalogKey = keyof typeof catalogs;

function getNestedMessage(
  messages: NestedMessages,
  key: string,
): string | NestedMessages | undefined {
  return key
    .split('.')
    .reduce<
      string | NestedMessages | undefined
    >((current, part) => (typeof current === 'object' && current !== null ? current[part] : undefined), messages);
}

function formatTemplate(template: string, values?: TemplateValues): string {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

export function normalizeLocale(locale: unknown): {
  normalized: string;
  catalogKey: CatalogKey;
  warningKey?: MessageKey;
  warningValues?: TemplateValues;
} {
  if (typeof locale !== 'string') {
    return {
      normalized: 'en',
      catalogKey: 'en',
      warningKey: 'errors.invalidLocaleMissing',
    };
  }

  const trimmed = locale.trim();
  if (!trimmed) {
    return {
      normalized: 'en',
      catalogKey: 'en',
      warningKey: 'errors.invalidLocaleMissing',
    };
  }

  const language = trimmed.toLowerCase().split('-')[0];

  if (language === 'tr') {
    return { normalized: language, catalogKey: 'tr' };
  }

  if (language === 'en') {
    return { normalized: language, catalogKey: 'en' };
  }

  return {
    normalized: language,
    catalogKey: 'en',
    warningKey: 'errors.unsupportedLocale',
    warningValues: { value: locale },
  };
}

export function createTranslator(locale: unknown) {
  const { catalogKey, warningKey, warningValues } = normalizeLocale(locale);
  const catalog = catalogs[catalogKey];

  const translator = (key: MessageKey, values?: TemplateValues) => {
    const rawMessage =
      getNestedMessage(catalog as NestedMessages, key) ??
      getNestedMessage(catalogs.en as NestedMessages, key) ??
      key;

    if (typeof rawMessage !== 'string') {
      return key;
    }

    return formatTemplate(rawMessage, values);
  };

  if (warningKey) {
    // Localized warning for invalid or unsupported locale input
     
    console.warn(translator(warningKey, warningValues));
  }

  return translator;
}

export type Translator = ReturnType<typeof createTranslator>;
