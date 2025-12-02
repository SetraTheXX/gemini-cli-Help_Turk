/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { createInstallCommand } from './extensions/install.js';
import { uninstallCommand } from './extensions/uninstall.js';
import { listCommand } from './extensions/list.js';
import { updateCommand } from './extensions/update.js';
import { createDisableCommand } from './extensions/disable.js';
import { enableCommand } from './extensions/enable.js';
import { linkCommand } from './extensions/link.js';
import { newCommand } from './extensions/new.js';
import { validateCommand } from './extensions/validate.js';
import { createTranslator, type Translator } from '../i18n/index.js';

export function createExtensionsCommand(t: Translator): CommandModule {
  return {
    command: 'extensions <command>',
    aliases: ['extension'],
    describe: t('extensions.describe'),
    builder: (yargs) =>
      yargs
        .command(createInstallCommand(t))
        .command(uninstallCommand)
        .command(listCommand)
        .command(updateCommand)
        .command(createDisableCommand(t))
        .command(enableCommand)
        .command(linkCommand)
        .command(newCommand)
        .command(validateCommand)
        .demandCommand(1, t('extensions.demandCommand'))
        .version(false),
    handler: () => {
      // This handler is not called when a subcommand is provided.
      // Yargs will show the help menu.
    },
  };
}

export const extensionsCommand = createExtensionsCommand(
  createTranslator('en'),
);
