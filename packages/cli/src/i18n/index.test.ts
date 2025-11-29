/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  detectPreferredLocale,
  getActiveLocale,
  getSupportedLocales,
  initializeI18n,
  translate,
} from './index.js';

describe('i18n runtime', () => {
  it('initializes with the preferred locale and falls back to default for unsupported locales', () => {
    initializeI18n('tr-TR');
    expect(getActiveLocale()).toBe('tr');
    expect(translate('app.welcome')).toContain('hoş geldiniz');

    initializeI18n('fr-FR');
    expect(getActiveLocale()).toBe('en');
    expect(translate('app.welcome')).toContain('Welcome');
  });

  it('returns keys when translations are missing', () => {
    initializeI18n('en');
    expect(translate('unknown.key')).toBe('unknown.key');
  });

  it('detects supported locales from environment variables or Intl defaults', () => {
    const locale = detectPreferredLocale();
    expect(typeof locale === 'string' || locale === undefined).toBe(true);
    expect(getSupportedLocales()).toContain('en');
  });
});
