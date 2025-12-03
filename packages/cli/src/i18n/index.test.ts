/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { createTranslator, normalizeLocale } from './index.js';

describe('createTranslator', () => {
  it('selects Turkish translations for tr locales', () => {
    const t = createTranslator('tr-TR');
    expect(t('options.debug')).toBe('Hata ayıklama modunda çalıştırılsın mı?');
  });

  it('falls back to English for unsupported locales', () => {
    const t = createTranslator('fr-FR');
    expect(t('options.debug')).toBe('Run in debug mode?');
  });

  it('interpolates template values', () => {
    const t = createTranslator('tr');
    expect(t('errors.invalidLocaleValue', { value: 'xx' })).toBe(
      'Geçersiz locale değeri: xx',
    );
  });

  it('normalizes invalid locale inputs and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator('');

    expect(t('options.model')).toBe('Model');
    expect(warnSpy).toHaveBeenCalledWith(
      'Invalid locale value: expected a non-empty string',
    );
    warnSpy.mockRestore();
  });

  it('provides localized warning for unsupported locales', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator('fr-FR');

    expect(t('errors.promptAndQuery')).toBe(
      'Cannot use both a positional prompt and the --prompt (-p) flag together',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Unsupported locale "fr-FR". Falling back to English.',
    );
    warnSpy.mockRestore();
  });

  it('exposes normalized locale information', () => {
    expect(normalizeLocale('TR').catalogKey).toBe('tr');
    expect(normalizeLocale('en-GB').catalogKey).toBe('en');
    expect(normalizeLocale('de').catalogKey).toBe('en');
  });
});
