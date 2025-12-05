/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HistoryItemCompression } from '../types.js';
import { MessageType } from '../types.js';
import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { uiTranslator } from '../i18n.js';

export const compressCommand: SlashCommand = {
  name: 'compress',
  altNames: ['summarize'],
  description: uiTranslator('ui.commands.compress.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const { ui } = context;
    if (ui.pendingItem) {
      ui.addItem(
        {
          type: MessageType.ERROR,
          text: uiTranslator('ui.commands.compress.alreadyCompressing'),
        },
        Date.now(),
      );
      return;
    }

    const pendingMessage: HistoryItemCompression = {
      type: MessageType.COMPRESSION,
      compression: {
        isPending: true,
        originalTokenCount: null,
        newTokenCount: null,
        compressionStatus: null,
      },
    };

    try {
      ui.setPendingItem(pendingMessage);
      const promptId = `compress-${Date.now()}`;
      const compressed = await context.services.config
        ?.getGeminiClient()
        ?.tryCompressChat(promptId, true);
      if (compressed) {
        ui.addItem(
          {
            type: MessageType.COMPRESSION,
            compression: {
              isPending: false,
              originalTokenCount: compressed.originalTokenCount,
              newTokenCount: compressed.newTokenCount,
              compressionStatus: compressed.compressionStatus,
            },
          } as HistoryItemCompression,
          Date.now(),
        );
      } else {
        ui.addItem(
          {
            type: MessageType.ERROR,
            text: uiTranslator('ui.commands.compress.failed'),
          },
          Date.now(),
        );
      }
    } catch (e) {
      ui.addItem(
        {
          type: MessageType.ERROR,
          text: uiTranslator('ui.commands.compress.failedWithReason', {
            reason: e instanceof Error ? e.message : String(e),
          }),
        },
        Date.now(),
      );
    } finally {
      ui.setPendingItem(null);
    }
  },
};
