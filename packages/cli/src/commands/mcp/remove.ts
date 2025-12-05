/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File for 'gemini mcp remove' command
import type { CommandModule } from 'yargs';
import { loadSettings, SettingScope } from '../../config/settings.js';
import { debugLogger } from '@google/gemini-cli-core';
import type { Translator } from '../../i18n/index.js';

async function removeMcpServer(
  name: string,
  options: {
    scope: string;
  },
  t: Translator,
) {
  const { scope } = options;
  const settingsScope =
    scope === 'user' ? SettingScope.User : SettingScope.Workspace;
  const settings = loadSettings();

  const existingSettings = settings.forScope(settingsScope).settings;
  const mcpServers = existingSettings.mcpServers || {};

  if (!mcpServers[name]) {
    debugLogger.log(t('commands.mcp.remove.notFound', { name, scope }));
    return;
  }

  delete mcpServers[name];

  settings.setValue(settingsScope, 'mcpServers', mcpServers);

  debugLogger.log(t('commands.mcp.remove.removed', { name, scope }));
}

export const createRemoveCommand = (t: Translator): CommandModule => ({
  command: 'remove <name>',
  describe: t('commands.mcp.remove.describe'),
  builder: (yargs) =>
    yargs
      .usage(t('commands.mcp.remove.usage'))
      .positional('name', {
        describe: t('commands.mcp.remove.name'),
        type: 'string',
        demandOption: true,
      })
      .option('scope', {
        alias: 's',
        describe: t('commands.mcp.remove.scope'),
        type: 'string',
        default: 'project',
        choices: ['user', 'project'],
      }),
  handler: async (argv) => {
    await removeMcpServer(
      argv['name'] as string,
      {
        scope: argv['scope'] as string,
      },
      t,
    );
  },
});
