/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import en from './messages/en.json' with { type: 'json' };
import tr from './messages/tr.json' with { type: 'json' };

type NestedMessageValue = string | string[] | NestedMessages;

interface NestedMessages {
  [key: string]: NestedMessageValue;
}

const catalogs = {
  en: en as NestedMessages,
  tr: tr as NestedMessages,
} satisfies Record<'en' | 'tr', NestedMessages>;

export type MessageKey = string;

export type TemplateValues = Record<string, string | number>;

type CatalogKey = keyof typeof catalogs;

function getNestedMessage(
  messages: NestedMessages,
  key: string,
): NestedMessageValue | undefined {
  return key
    .split('.')
    .reduce<NestedMessageValue | undefined>((current, part) => {
      if (
        Array.isArray(current) ||
        typeof current !== 'object' ||
        current === null
      ) {
        return undefined;
      }
      return (current as NestedMessages)[part];
    }, messages);
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

export function getLocalizedArray(
  locale: unknown,
  key: string,
): string[] | undefined {
  const { catalogKey } = normalizeLocale(locale);
  const catalog = catalogs[catalogKey];
  const fallback = catalogs.en;

  const message =
    getNestedMessage(catalog as NestedMessages, key) ??
    getNestedMessage(fallback as NestedMessages, key);

  if (Array.isArray(message)) {
    return message as string[];
  }

  return undefined;
}

export type Translator = ReturnType<typeof createTranslator>;
