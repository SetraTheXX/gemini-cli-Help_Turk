/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { detectLocale, normalizeLocale, validateLocale } from './locale.js';
import { debugLogger } from '@google/gemini-cli-core';

vi.mock('@google/gemini-cli-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/gemini-cli-core')>();
  return {
    ...actual,
    debugLogger: {
      ...actual.debugLogger,
      warn: vi.fn(),
    },
  };
});

describe('normalizeLocale', () => {
  const originalWarn = debugLogger.warn;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    debugLogger.warn = originalWarn;
  });

  it('converts underscores and strips encodings', () => {
    expect(normalizeLocale('tr_TR.UTF-8')).toBe('tr-TR');
    expect(normalizeLocale('en_US')).toBe('en-US');
  });

  it('returns undefined for empty or invalid values', () => {
    expect(normalizeLocale('')).toBeUndefined();
    expect(normalizeLocale('   ')).toBeUndefined();
    expect(normalizeLocale(null)).toBeUndefined();
    expect(normalizeLocale(undefined)).toBeUndefined();
  });

  it('logs and returns undefined for invalid locale strings', () => {
    const result = normalizeLocale('not_a_locale');
    expect(result).toBeUndefined();
    expect(debugLogger.warn).toHaveBeenCalledWith(
      'Invalid locale provided',
      expect.objectContaining({ locale: 'not_a_locale' }),
    );
  });
});

describe('detectLocale', () => {
  it('prefers LC_ALL then LC_MESSAGES then LANG', () => {
    const env = {
      LC_ALL: 'es_MX.UTF-8',
      LC_MESSAGES: 'fr_FR.UTF-8',
      LANG: 'tr_TR.UTF-8',
    } as NodeJS.ProcessEnv;

    expect(detectLocale(env)).toBe('es-MX');
  });

  it('falls back to LANG when others missing', () => {
    const env = { LANG: 'tr_TR.UTF-8' } as NodeJS.ProcessEnv;
    expect(detectLocale(env)).toBe('tr-TR');
  });

  it('returns fallback when no locale variables set', () => {
    const env = {} as NodeJS.ProcessEnv;
    expect(detectLocale(env, 'en')).toBe('en');
  });
});

describe('validateLocale', () => {
  it('returns normalized locale for valid input', () => {
    expect(validateLocale('tr_TR.UTF-8')).toBe('tr-TR');
  });

  it('throws for invalid values', () => {
    expect(() => validateLocale('')).toThrow(
      'Invalid locale value: expected a non-empty string',
    );
    expect(() => validateLocale('not_a_locale')).toThrow(
      'Invalid locale value: not_a_locale',
    );
  });
});
