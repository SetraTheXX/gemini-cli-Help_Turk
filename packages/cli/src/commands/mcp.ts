/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File for 'gemini mcp' command
import type { CommandModule, Argv } from 'yargs';
import { addCommand } from './mcp/add.js';
import { removeCommand } from './mcp/remove.js';
import { listCommand } from './mcp/list.js';
import { t } from '../i18n/index.js';

export const mcpCommand: CommandModule = {
  command: 'mcp',
  describe: t('commands.mcp.describe'),
  builder: (yargs: Argv) =>
    yargs
      .command(addCommand)
      .command(removeCommand)
      .command(listCommand)
      .demandCommand(1, t('commands.common.needSubcommand'))
      .version(false),
  handler: () => {
    // yargs will automatically show help if no subcommand is provided
    // thanks to demandCommand(1) in the builder.
  },
};
