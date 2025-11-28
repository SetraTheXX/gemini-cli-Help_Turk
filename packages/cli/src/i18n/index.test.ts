/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, beforeEach } from 'vitest';
import type { Settings } from '../config/settingsSchema.js';
import { getLocale, t } from './index.js';

describe('i18n helper', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns translated strings for the requested locale', () => {
    expect(t('commands.extensions.describe', { locale: 'tr' })).toBe(
      'Gemini CLI uzantılarını yönetin.',
    );
  });

  it('falls back to English for unsupported locales', () => {
    expect(t('commands.extensions.describe', { locale: 'fr' })).toBe(
      'Manage Gemini CLI extensions.',
    );
  });

  it('prefers locale from settings when provided', () => {
    const settings = {
      general: { locale: 'tr' },
    } as unknown as Settings;

    expect(getLocale({ settings })).toBe('tr');
  });

  it('falls back to English when a translation key is missing', () => {
    expect(t('i18n.fallback.sample', { locale: 'tr' })).toBe(
      'English fallback value.',
    );
  });
});
