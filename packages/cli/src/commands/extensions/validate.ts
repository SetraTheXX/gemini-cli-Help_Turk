/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { debugLogger } from '@google/gemini-cli-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import semver from 'semver';
import { getErrorMessage } from '../../utils/errors.js';
import type { ExtensionConfig } from '../../config/extension.js';
import { ExtensionManager } from '../../config/extension-manager.js';
import { requestConsentNonInteractive } from '../../config/extensions/consent.js';
import { promptForSetting } from '../../config/extensions/extensionSettings.js';
import { loadSettings } from '../../config/settings.js';
import { t } from '../../i18n/index.js';

interface ValidateArgs {
  path: string;
}

export async function handleValidate(args: ValidateArgs) {
  try {
    await validateExtension(args);
    debugLogger.log(
      t('commands.extensions.validate.success', { path: args.path }),
    );
  } catch (error) {
    debugLogger.error(getErrorMessage(error));
    process.exit(1);
  }
}

async function validateExtension(args: ValidateArgs) {
  const workspaceDir = process.cwd();
  const extensionManager = new ExtensionManager({
    workspaceDir,
    requestConsent: requestConsentNonInteractive,
    requestSetting: promptForSetting,
    settings: loadSettings(workspaceDir).merged,
  });
  const absoluteInputPath = path.resolve(args.path);
  const extensionConfig: ExtensionConfig =
    extensionManager.loadExtensionConfig(absoluteInputPath);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (extensionConfig.contextFileName) {
    const contextFileNames = Array.isArray(extensionConfig.contextFileName)
      ? extensionConfig.contextFileName
      : [extensionConfig.contextFileName];

    const missingContextFiles: string[] = [];
    for (const contextFilePath of contextFileNames) {
      const contextFileAbsolutePath = path.resolve(
        absoluteInputPath,
        contextFilePath,
      );
      if (!fs.existsSync(contextFileAbsolutePath)) {
        missingContextFiles.push(contextFilePath);
      }
    }
    if (missingContextFiles.length > 0) {
      errors.push(
        `The following context files referenced in gemini-extension.json are missing: ${missingContextFiles}`,
      );
    }
  }

  if (!semver.valid(extensionConfig.version)) {
    warnings.push(
      t('commands.extensions.validate.semverWarning', {
        version: extensionConfig.version,
      }),
    );
  }

  if (warnings.length > 0) {
    debugLogger.warn(t('commands.extensions.validate.warningHeader'));
    for (const warning of warnings) {
      debugLogger.warn(`  - ${warning}`);
    }
  }

  if (errors.length > 0) {
    debugLogger.error(t('commands.extensions.validate.errorHeader'));
    for (const error of errors) {
      debugLogger.error(`  - ${error}`);
    }
    throw new Error(t('commands.extensions.validate.failure'));
  }
}

export const validateCommand: CommandModule = {
  command: 'validate <path>',
  describe: t('commands.extensions.validate.describe'),
  builder: (yargs) =>
    yargs.positional('path', {
      describe: t('commands.extensions.validate.path'),
      type: 'string',
      demandOption: true,
    }),
  handler: async (args) => {
    await handleValidate({
      path: args['path'] as string,
    });
  },
};
