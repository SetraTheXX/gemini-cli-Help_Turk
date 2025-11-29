/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { getErrorMessage } from '../../utils/errors.js';
import { debugLogger } from '@google/gemini-cli-core';
import { requestConsentNonInteractive } from '../../config/extensions/consent.js';
import { ExtensionManager } from '../../config/extension-manager.js';
import { loadSettings } from '../../config/settings.js';
import { promptForSetting } from '../../config/extensions/extensionSettings.js';
import { t } from '../../i18n/index.js';

interface UninstallArgs {
  names: string[]; // can be extension names or source URLs.
}

export async function handleUninstall(args: UninstallArgs) {
  try {
    const workspaceDir = process.cwd();
    const extensionManager = new ExtensionManager({
      workspaceDir,
      requestConsent: requestConsentNonInteractive,
      requestSetting: promptForSetting,
      settings: loadSettings(workspaceDir).merged,
    });
    await extensionManager.loadExtensions();

    const errors: Array<{ name: string; error: string }> = [];
    for (const name of [...new Set(args.names)]) {
      try {
        await extensionManager.uninstallExtension(name, false);
        debugLogger.log(t('commands.extensions.uninstall.success', { name }));
      } catch (error) {
        errors.push({ name, error: getErrorMessage(error) });
      }
    }

    if (errors.length > 0) {
      for (const { name, error } of errors) {
        debugLogger.error(
          t('commands.extensions.uninstall.failure', { name, error }),
        );
      }
      process.exit(1);
    }
  } catch (error) {
    debugLogger.error(getErrorMessage(error));
    process.exit(1);
  }
}

export const uninstallCommand: CommandModule = {
  command: 'uninstall <names..>',
  describe: t('commands.extensions.uninstall.describe'),
  builder: (yargs) =>
    yargs
      .positional('names', {
        describe: t('commands.extensions.uninstall.name'),
        type: 'string',
        array: true,
      })
      .check((argv) => {
        if (!argv.names || (argv.names as string[]).length === 0) {
          throw new Error(
            t('commands.extensions.uninstall.nameRequired'),
          );
        }
        return true;
      }),
  handler: async (argv) => {
    await handleUninstall({
      names: argv['names'] as string[],
    });
  },
};
