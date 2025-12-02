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

function resolveCatalog(locale: string): CatalogKey {
  const language = locale.toLowerCase().split('-')[0];
  if (language === 'tr') {
    return 'tr';
  }
  return 'en';
}

export function createTranslator(locale: string) {
  const catalogKey = resolveCatalog(locale);
  const catalog = catalogs[catalogKey];

  return (key: MessageKey, values?: TemplateValues) => {
    const rawMessage =
      getNestedMessage(catalog as NestedMessages, key) ??
      getNestedMessage(catalogs.en as NestedMessages, key) ??
      key;

    if (typeof rawMessage !== 'string') {
      return key;
    }

    return formatTemplate(rawMessage, values);
  };
}

export type Translator = ReturnType<typeof createTranslator>;
