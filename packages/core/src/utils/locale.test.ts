/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getUserLocale, resetUserLocaleCache } from './locale.js';

describe('getUserLocale', () => {
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

  it('prefers LC_ALL and normalizes hyphenated locales', () => {
    process.env['LC_ALL'] = 'en-US.UTF-8';
    process.env['LC_CTYPE'] = '';
    process.env['LANG'] = '';

    expect(getUserLocale()).toBe('en_US');
  });

  it('falls back to LC_CTYPE then LANG', () => {
    process.env['LC_ALL'] = '';
    process.env['LC_CTYPE'] = 'tr_TR';
    process.env['LANG'] = 'fr_CA';

    expect(getUserLocale()).toBe('tr_TR');
  });

  it('returns only the language when no region is present', () => {
    process.env['LC_ALL'] = '';
    process.env['LC_CTYPE'] = '';
    process.env['LANG'] = 'tr';

    expect(getUserLocale()).toBe('tr');
  });

  it('normalizes Intl locale when environment variables are empty', () => {
    process.env['LC_ALL'] = '';
    process.env['LC_CTYPE'] = '';
    process.env['LANG'] = '';

    const resolvedOptions = vi.fn().mockReturnValue({ locale: 'fr-CA' });
    Intl.DateTimeFormat = vi.fn().mockReturnValue({ resolvedOptions });

    expect(getUserLocale()).toBe('fr_CA');
  });
});
