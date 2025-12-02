/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import {
  debugLogger,
  type ExtensionInstallMetadata,
} from '@google/gemini-cli-core';
import { stat } from 'node:fs/promises';
import {
  INSTALL_WARNING_MESSAGE,
  requestConsentNonInteractive,
} from '../../config/extensions/consent.js';
import { ExtensionManager } from '../../config/extension-manager.js';
import { loadSettings } from '../../config/settings.js';
import { promptForSetting } from '../../config/extensions/extensionSettings.js';
import { createTranslator, type Translator } from '../../i18n/index.js';
import { getErrorMessage } from '../../utils/errors.js';

interface InstallArgs {
  source: string;
  ref?: string;
  autoUpdate?: boolean;
  allowPreRelease?: boolean;
  consent?: boolean;
}

export async function handleInstall(
  args: InstallArgs,
  t: Translator = createTranslator('en'),
) {
  try {
    let installMetadata: ExtensionInstallMetadata;
    const { source } = args;
    if (
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('git@') ||
      source.startsWith('sso://')
    ) {
      installMetadata = {
        source,
        type: 'git',
        ref: args.ref,
        autoUpdate: args.autoUpdate,
        allowPreRelease: args.allowPreRelease,
      };
    } else {
      if (args.ref || args.autoUpdate) {
        throw new Error(t('extensions.install.errors.localRefNotAllowed'));
      }
      try {
        await stat(source);
        installMetadata = {
          source,
          type: 'local',
        };
      } catch {
        throw new Error(t('extensions.install.errors.sourceNotFound'));
      }
    }

    const requestConsent = args.consent
      ? () => Promise.resolve(true)
      : requestConsentNonInteractive;
    if (args.consent) {
      debugLogger.log(t('extensions.install.logs.consentAcknowledged'));
      debugLogger.log(INSTALL_WARNING_MESSAGE);
    }

    const workspaceDir = process.cwd();
    const extensionManager = new ExtensionManager({
      workspaceDir,
      requestConsent,
      requestSetting: promptForSetting,
      settings: loadSettings(workspaceDir).merged,
    });
    await extensionManager.loadExtensions();
    const extension =
      await extensionManager.installOrUpdateExtension(installMetadata);
    debugLogger.log(
      t('extensions.install.logs.success', { name: extension.name }),
    );
  } catch (error) {
    debugLogger.error(getErrorMessage(error));
    process.exit(1);
  }
}

export function createInstallCommand(t: Translator): CommandModule {
  return {
    command: 'install <source> [--auto-update] [--pre-release]',
    describe: t('extensions.install.describe'),
    builder: (yargs) =>
      yargs
        .positional('source', {
          describe: t('extensions.install.source'),
          type: 'string',
          demandOption: true,
        })
        .option('ref', {
          describe: t('extensions.install.ref'),
          type: 'string',
        })
        .option('auto-update', {
          describe: t('extensions.install.autoUpdate'),
          type: 'boolean',
        })
        .option('pre-release', {
          describe: t('extensions.install.preRelease'),
          type: 'boolean',
        })
        .option('consent', {
          describe: t('extensions.install.consent'),
          type: 'boolean',
          default: false,
        })
        .check((argv) => {
          if (!argv.source) {
            throw new Error(t('extensions.install.errors.sourceMissing'));
          }
          return true;
        }),
    handler: async (argv) => {
      await handleInstall(
        {
          source: argv['source'] as string,
          ref: argv['ref'] as string | undefined,
          autoUpdate: argv['auto-update'] as boolean | undefined,
          allowPreRelease: argv['pre-release'] as boolean | undefined,
          consent: argv['consent'] as boolean | undefined,
        },
        t,
      );
    },
  };
}

export const installCommand = createInstallCommand(createTranslator('en'));
