/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File for 'gemini mcp' command
import type { CommandModule, Argv } from 'yargs';
import { createAddCommand } from './mcp/add.js';
import { createRemoveCommand } from './mcp/remove.js';
import { createListCommand } from './mcp/list.js';
import { createTranslator, type Translator } from '../i18n/index.js';
import { detectLocale } from '../utils/locale.js';

export function createMcpCommand(t: Translator): CommandModule {
  return {
    command: 'mcp',
    describe: t('commands.mcp.describe'),
    builder: (yargs: Argv) =>
      yargs
        .command(createAddCommand(t))
        .command(createRemoveCommand(t))
        .command(createListCommand(t))
        .demandCommand(1, t('commands.mcp.demand'))
        .version(false),
    handler: () => {
      // yargs will automatically show help if no subcommand is provided
      // thanks to demandCommand(1) in the builder.
    },
  };
}

export const mcpCommand = createMcpCommand(
  createTranslator(detectLocale(process.env, 'en')),
);
