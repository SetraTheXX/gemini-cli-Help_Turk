/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type CommandModule } from 'yargs';
import { loadSettings, SettingScope } from '../../config/settings.js';
import { getErrorMessage } from '../../utils/errors.js';
import { debugLogger } from '@google/gemini-cli-core';
import { ExtensionManager } from '../../config/extension-manager.js';
import { requestConsentNonInteractive } from '../../config/extensions/consent.js';
import { promptForSetting } from '../../config/extensions/extensionSettings.js';
import { createTranslator, type Translator } from '../../i18n/index.js';

interface DisableArgs {
  name: string;
  scope?: string;
}

export async function handleDisable(
  args: DisableArgs,
  t: Translator = createTranslator('en'),
) {
  const workspaceDir = process.cwd();
  const extensionManager = new ExtensionManager({
    workspaceDir,
    requestConsent: requestConsentNonInteractive,
    requestSetting: promptForSetting,
    settings: loadSettings(workspaceDir).merged,
  });
  await extensionManager.loadExtensions();

  try {
    if (args.scope?.toLowerCase() === 'workspace') {
      await extensionManager.disableExtension(
        args.name,
        SettingScope.Workspace,
      );
    } else {
      await extensionManager.disableExtension(args.name, SettingScope.User);
    }
    debugLogger.log(
      t('extensions.disable.logs.success', {
        name: args.name,
        scope: args.scope ?? SettingScope.User,
      }),
    );
  } catch (error) {
    debugLogger.error(getErrorMessage(error));
    process.exit(1);
  }
}

export function createDisableCommand(t: Translator): CommandModule {
  return {
    command: 'disable [--scope] <name>',
    describe: t('extensions.disable.describe'),
    builder: (yargs) =>
      yargs
        .positional('name', {
          describe: t('extensions.disable.name'),
          type: 'string',
        })
        .option('scope', {
          describe: t('extensions.disable.scope'),
          type: 'string',
          default: SettingScope.User,
        })
        .check((argv) => {
          const allowedScopes = Object.values(SettingScope).map((s) =>
            s.toLowerCase(),
          );
          if (
            argv.scope &&
            !allowedScopes.includes((argv.scope as string).toLowerCase())
          ) {
            throw new Error(
              t('extensions.disable.errors.invalidScope', {
                scope: String(argv.scope),
                allowedScopes: allowedScopes.join(', '),
              }),
            );
          }
          return true;
        }),
    handler: async (argv) => {
      await handleDisable(
        {
          name: argv['name'] as string,
          scope: argv['scope'] as string,
        },
        t,
      );
    },
  };
}

export const disableCommand = createDisableCommand(createTranslator('en'));
