/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { t } from './index.js';

describe('i18n helper', () => {
  it('returns English strings by default', () => {
    expect(t('commands.mcp.describe')).toBe('Manage MCP servers');
  });

  it('returns translated strings when available', () => {
    expect(t('commands.mcp.describe', undefined, 'tr')).toBe(
      'MCP sunucularını yönetin',
    );
  });

  it('interpolates variables in templates', () => {
    expect(
      t('commands.mcp.add.added', {
        name: 'alpha',
        scope: 'workspace',
        transport: 'stdio',
      }),
    ).toBe('MCP server "alpha" added to workspace settings. (stdio)');
  });

  it('falls back to English for unsupported locales and missing keys', () => {
    expect(t('commands.common.needSubcommand', undefined, 'fr' as 'en')).toBe(
      'You need at least one command before continuing.',
    );
    expect(t('nonexistent.key' as string, undefined, 'tr')).toBe('nonexistent.key');
  });
});
