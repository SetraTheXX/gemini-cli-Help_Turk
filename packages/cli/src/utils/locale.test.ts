/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getUserLocale, resetUserLocaleCache } from './locale.js';

describe('CLI locale helper', () => {
  const originalEnv = process.env;
  let originalIntl: typeof Intl.DateTimeFormat;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['LC_ALL'];
    delete process.env['LC_CTYPE'];
    delete process.env['LANG'];
    resetUserLocaleCache();
    originalIntl = Intl.DateTimeFormat;
  });

  afterEach(() => {
    process.env = originalEnv;
    resetUserLocaleCache();
    Intl.DateTimeFormat = originalIntl;
  });

  it('normalizes locale format to match core helper', () => {
    process.env['LC_ALL'] = 'de-DE.UTF-8';

    expect(getUserLocale()).toBe('de_DE');
  });

  it('uses Intl fallback with matching normalization when env is empty', () => {
    process.env['LC_ALL'] = '';
    process.env['LC_CTYPE'] = '';
    process.env['LANG'] = '';

    const resolvedOptions = vi.fn().mockReturnValue({ locale: 'tr' });
    Intl.DateTimeFormat = vi.fn().mockReturnValue({ resolvedOptions });

    expect(getUserLocale()).toBe('tr');
  });
});
