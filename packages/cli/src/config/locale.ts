/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Settings } from './settings.js';

export const DEFAULT_LOCALE = 'en-US';

const YARGS_SUPPORTED_LOCALES = new Set([
  'be',
  'cs',
  'de',
  'en',
  'es',
  'fi',
  'fr',
  'hi',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'nb',
  'nl',
  'nn',
  'pirate',
  'pl',
  'pt',
  'pt_BR',
  'ru',
  'th',
  'tr',
  'uk_UA',
  'uz',
  'zh_CN',
  'zh_TW',
]);

const LC_ENV_PRIORITY = ['LC_ALL', 'LC_MESSAGES', 'LANG'];

function sanitizeLocaleInput(locale?: string): string | undefined {
  if (!locale) return undefined;
  // Strip encoding (e.g., UTF-8) and modifiers (e.g., @euro)
  const [withoutEncoding] = locale.split('.');
  const [cleaned] = withoutEncoding.split('@');
  if (cleaned === 'C' || cleaned === 'POSIX') return undefined;
  return cleaned.trim();
}

function pickEnvLocale(env: NodeJS.ProcessEnv): string | undefined {
  for (const key of LC_ENV_PRIORITY) {
    if (env[key]) {
      return sanitizeLocaleInput(env[key]);
    }
  }

  const fallbackKey = Object.keys(env).find(
    (key) => key.startsWith('LC_') && env[key],
  );

  return sanitizeLocaleInput(fallbackKey ? env[fallbackKey] : undefined);
}

function parseLocaleArg(argv: readonly string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--locale' || arg === '-L') {
      return argv[i + 1];
    }

    if (arg.startsWith('--locale=')) {
      return arg.split('=')[1];
    }

    if (arg.startsWith('-L') && arg.length > 2) {
      return arg.slice(2);
    }
  }

  return undefined;
}

export function validateLocale(locale: string): string {
  if (!locale || typeof locale !== 'string') {
    throw new Error('Locale must be a non-empty string (e.g., en or en-US).');
  }

  const trimmed = locale.trim();
  const normalizedInput = trimmed.replace('_', '-');
  const [language, region] = normalizedInput.split('-');

  if (!/^[a-zA-Z]{2,3}$/.test(language ?? '')) {
    throw new Error(
      `Invalid locale "${locale}". Expected a two or three letter language code (e.g., en).`,
    );
  }

  if (region && !/^[a-zA-Z]{2,4}$/.test(region)) {
    throw new Error(
      `Invalid locale region in "${locale}". Expected 2-4 letters after the dash (e.g., en-US).`,
    );
  }

  return region
    ? `${language.toLowerCase()}-${region.toUpperCase()}`
    : language.toLowerCase();
}

export function getYargsLocale(locale: string): string {
  const normalized = locale.replace('-', '_');
  if (YARGS_SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }

  const languageOnly = locale.split(/[-_]/)[0]?.toLowerCase();
  if (languageOnly && YARGS_SUPPORTED_LOCALES.has(languageOnly)) {
    return languageOnly;
  }

  return 'en';
}

interface LocaleResolutionParams {
  argv: readonly string[];
  settings: Settings;
  env?: NodeJS.ProcessEnv;
}

export function resolveLocale({
  argv,
  settings,
  env = process.env,
}: LocaleResolutionParams): { locale: string; yargsLocale: string } {
  const cliLocale = parseLocaleArg(argv);
  const configLocale = settings?.general?.locale;
  const envLocale = pickEnvLocale(env);

  const sourceLocale = cliLocale ?? configLocale ?? envLocale ?? DEFAULT_LOCALE;

  try {
    const locale = validateLocale(sourceLocale);
    return { locale, yargsLocale: getYargsLocale(locale) };
  } catch (error) {
    const sourceLabel = cliLocale
      ? 'CLI flag'
      : configLocale
        ? 'config general.locale'
        : envLocale
          ? 'environment (LANG/LC_*)'
          : 'default locale';

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unknown locale error';
    throw new Error(`Invalid locale from ${sourceLabel}: ${message}`);
  }
}
