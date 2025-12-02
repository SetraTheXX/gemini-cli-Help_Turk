/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { createTranslator } from './index.js';

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
});
