/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type CommandModule } from 'yargs';
import { loadSettings, SettingScope } from '../../config/settings.js';
import { requestConsentNonInteractive } from '../../config/extensions/consent.js';
import { ExtensionManager } from '../../config/extension-manager.js';
import {
  debugLogger,
  FatalConfigError,
  getErrorMessage,
} from '@google/gemini-cli-core';
import { promptForSetting } from '../../config/extensions/extensionSettings.js';
import { t } from '../../i18n/index.js';

interface EnableArgs {
  name: string;
  scope?: string;
}

export async function handleEnable(args: EnableArgs) {
  const workingDir = process.cwd();
  const extensionManager = new ExtensionManager({
    workspaceDir: workingDir,
    requestConsent: requestConsentNonInteractive,
    requestSetting: promptForSetting,
    settings: loadSettings(workingDir).merged,
  });
  await extensionManager.loadExtensions();

  try {
    if (args.scope?.toLowerCase() === 'workspace') {
      await extensionManager.enableExtension(args.name, SettingScope.Workspace);
    } else {
      await extensionManager.enableExtension(args.name, SettingScope.User);
    }
    if (args.scope) {
      debugLogger.log(
        t('commands.extensions.enable.successScoped', {
          name: args.name,
          scope: args.scope,
        }),
      );
    } else {
      debugLogger.log(
        t('commands.extensions.enable.successAll', { name: args.name }),
      );
    }
  } catch (error) {
    throw new FatalConfigError(getErrorMessage(error));
  }
}

export const enableCommand: CommandModule = {
  command: 'enable [--scope] <name>',
  describe: t('commands.extensions.enable.describe'),
  builder: (yargs) =>
    yargs
      .positional('name', {
        describe: t('commands.extensions.enable.name'),
        type: 'string',
      })
      .option('scope', {
        describe: t('commands.extensions.enable.scope'),
        type: 'string',
      })
      .check((argv) => {
        if (
          argv.scope &&
          !Object.values(SettingScope)
            .map((s) => s.toLowerCase())
            .includes((argv.scope as string).toLowerCase())
        ) {
          throw new Error(
            t('commands.extensions.enable.invalidScope', {
              scope: String(argv.scope),
              scopes: Object.values(SettingScope)
                .map((s) => s.toLowerCase())
                .join(', '),
            }),
          );
        }
        return true;
      }),
  handler: async (argv) => {
    await handleEnable({
      name: argv['name'] as string,
      scope: argv['scope'] as string,
    });
  },
};
