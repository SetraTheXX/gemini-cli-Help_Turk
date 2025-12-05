/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { uiTelemetryService } from '@google/gemini-cli-core';
import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { uiTranslator } from '../i18n.js';

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: uiTranslator('ui.commands.clear.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context, _args) => {
    const geminiClient = context.services.config?.getGeminiClient();

    if (geminiClient) {
      context.ui.setDebugMessage(uiTranslator('ui.commands.clear.resetting'));
      // If resetChat fails, the exception will propagate and halt the command,
      // which is the correct behavior to signal a failure to the user.
      await geminiClient.resetChat();
    } else {
      context.ui.setDebugMessage(uiTranslator('ui.commands.clear.clearing'));
    }

    uiTelemetryService.setLastPromptTokenCount(0);
    context.ui.clear();
  },
};
