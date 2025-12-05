/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCliVersion } from '../../utils/version.js';
import type { CommandContext, SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import process from 'node:process';
import { MessageType, type HistoryItemAbout } from '../types.js';
import { IdeClient } from '@google/gemini-cli-core';
import { uiTranslator } from '../i18n.js';

export const aboutCommand: SlashCommand = {
  name: 'about',
  description: uiTranslator('ui.commands.about.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const osVersion = process.platform;
    let sandboxEnv = uiTranslator('ui.commands.about.noSandbox');
    if (process.env['SANDBOX'] && process.env['SANDBOX'] !== 'sandbox-exec') {
      sandboxEnv = process.env['SANDBOX'];
    } else if (process.env['SANDBOX'] === 'sandbox-exec') {
      sandboxEnv = uiTranslator('ui.commands.about.sandboxExec', {
        profile:
          process.env['SEATBELT_PROFILE'] ||
          uiTranslator('ui.commands.about.unknownSandbox'),
      });
    }
    const modelVersion =
      context.services.config?.getModel() ||
      uiTranslator('ui.commands.about.unknownModel');
    const cliVersion = await getCliVersion();
    const selectedAuthType =
      context.services.settings.merged.security?.auth?.selectedType || '';
    const gcpProject = process.env['GOOGLE_CLOUD_PROJECT'] || '';
    const ideClient = await getIdeClientName(context);

    const aboutItem: Omit<HistoryItemAbout, 'id'> = {
      type: MessageType.ABOUT,
      cliVersion,
      osVersion,
      sandboxEnv,
      modelVersion,
      selectedAuthType,
      gcpProject,
      ideClient,
    };

    context.ui.addItem(aboutItem, Date.now());
  },
};

async function getIdeClientName(context: CommandContext) {
  if (!context.services.config?.getIdeMode()) {
    return '';
  }
  const ideClient = await IdeClient.getInstance();
  return ideClient?.getDetectedIdeDisplayName() ?? '';
}
