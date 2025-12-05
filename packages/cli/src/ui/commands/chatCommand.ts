/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fsPromises from 'node:fs/promises';
import React from 'react';
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import type {
  CommandContext,
  SlashCommand,
  MessageActionReturn,
  SlashCommandActionReturn,
} from './types.js';
import { CommandKind } from './types.js';
import { decodeTagName } from '@google/gemini-cli-core';
import path from 'node:path';
import type {
  HistoryItemWithoutId,
  HistoryItemChatList,
  ChatDetail,
} from '../types.js';
import { MessageType } from '../types.js';
import type { Content } from '@google/genai';
import { uiTranslator } from '../i18n.js';

const getSavedChatTags = async (
  context: CommandContext,
  mtSortDesc: boolean,
): Promise<ChatDetail[]> => {
  const cfg = context.services.config;
  const geminiDir = cfg?.storage?.getProjectTempDir();
  if (!geminiDir) {
    return [];
  }
  try {
    const file_head = 'checkpoint-';
    const file_tail = '.json';
    const files = await fsPromises.readdir(geminiDir);
    const chatDetails: ChatDetail[] = [];

    for (const file of files) {
      if (file.startsWith(file_head) && file.endsWith(file_tail)) {
        const filePath = path.join(geminiDir, file);
        const stats = await fsPromises.stat(filePath);
        const tagName = file.slice(file_head.length, -file_tail.length);
        chatDetails.push({
          name: decodeTagName(tagName),
          mtime: stats.mtime.toISOString(),
        });
      }
    }

    chatDetails.sort((a, b) =>
      mtSortDesc
        ? b.mtime.localeCompare(a.mtime)
        : a.mtime.localeCompare(b.mtime),
    );

    return chatDetails;
  } catch (_err) {
    return [];
  }
};

const listCommand: SlashCommand = {
  name: 'list',
  description: uiTranslator('commands.chat.listDescription'),
  kind: CommandKind.BUILT_IN,
  action: async (context): Promise<void> => {
    const chatDetails = await getSavedChatTags(context, false);

    const item: HistoryItemChatList = {
      type: MessageType.CHAT_LIST,
      chats: chatDetails,
    };

    context.ui.addItem(item, Date.now());
  },
};

const saveCommand: SlashCommand = {
  name: 'save',
  description: uiTranslator('commands.chat.save.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context, args): Promise<SlashCommandActionReturn | void> => {
    const tag = args.trim();
    if (!tag) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.save.missingTag'),
      };
    }

    const { logger, config } = context.services;
    await logger.initialize();

    if (!context.overwriteConfirmed) {
      const exists = await logger.checkpointExists(tag);
      if (exists) {
        return {
          type: 'confirm_action',
          prompt: React.createElement(
            Text,
            null,
            uiTranslator('commands.chat.save.overwritePromptPrefix'),
            React.createElement(Text, { color: theme.text.accent }, tag),
            uiTranslator('commands.chat.save.overwritePromptSuffix'),
          ),
          originalInvocation: {
            raw: context.invocation?.raw || `/chat save ${tag}`,
          },
        };
      }
    }

    const chat = await config?.getGeminiClient()?.getChat();
    if (!chat) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.save.noChatClient'),
      };
    }

    const history = chat.getHistory();
    if (history.length > 2) {
      const authType = config?.getContentGeneratorConfig()?.authType;
      await logger.saveCheckpoint({ history, authType }, tag);
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.save.saved', {
          tag: decodeTagName(tag),
        }),
      };
    } else {
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.save.noConversation'),
      };
    }
  },
};

const resumeCommand: SlashCommand = {
  name: 'resume',
  altNames: ['load'],
  description: uiTranslator('commands.chat.resume.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context, args) => {
    const tag = args.trim();
    if (!tag) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.resume.missingTag'),
      };
    }

    const { logger, config } = context.services;
    await logger.initialize();
    const checkpoint = await logger.loadCheckpoint(tag);
    const conversation = checkpoint.history;

    if (conversation.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.resume.notFound', {
          tag: decodeTagName(tag),
        }),
      };
    }

    const currentAuthType = config?.getContentGeneratorConfig()?.authType;
    if (
      checkpoint.authType &&
      currentAuthType &&
      checkpoint.authType !== currentAuthType
    ) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.resume.authMismatch', {
          authType: checkpoint.authType,
          currentAuthType,
        }),
      };
    }

    const rolemap: { [key: string]: MessageType } = {
      user: MessageType.USER,
      model: MessageType.GEMINI,
    };

    const uiHistory: HistoryItemWithoutId[] = [];
    let hasSystemPrompt = false;
    let i = 0;

    for (const item of conversation) {
      i += 1;
      const text =
        item.parts
          ?.filter((m) => !!m.text)
          .map((m) => m.text)
          .join('') || '';
      if (!text) {
        continue;
      }
      if (i === 1 && text.match(/context for our chat/)) {
        hasSystemPrompt = true;
      }
      if (i > 2 || !hasSystemPrompt) {
        uiHistory.push({
          type: (item.role && rolemap[item.role]) || MessageType.GEMINI,
          text,
        } as HistoryItemWithoutId);
      }
    }
    return {
      type: 'load_history',
      history: uiHistory,
      clientHistory: conversation,
    };
  },
  completion: async (context, partialArg) => {
    const chatDetails = await getSavedChatTags(context, true);
    return chatDetails
      .map((chat) => chat.name)
      .filter((name) => name.startsWith(partialArg));
  },
};

const deleteCommand: SlashCommand = {
  name: 'delete',
  description: uiTranslator('commands.chat.delete.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context, args): Promise<MessageActionReturn> => {
    const tag = args.trim();
    if (!tag) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.delete.missingTag'),
      };
    }

    const { logger } = context.services;
    await logger.initialize();
    const deleted = await logger.deleteCheckpoint(tag);

    if (deleted) {
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.delete.deleted', {
          tag: decodeTagName(tag),
        }),
      };
    } else {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.delete.notFound', {
          tag: decodeTagName(tag),
        }),
      };
    }
  },
  completion: async (context, partialArg) => {
    const chatDetails = await getSavedChatTags(context, true);
    return chatDetails
      .map((chat) => chat.name)
      .filter((name) => name.startsWith(partialArg));
  },
};

export function serializeHistoryToMarkdown(history: Content[]): string {
  return history
    .map((item) => {
      const text =
        item.parts
          ?.map((part) => {
            if (part.text) {
              return part.text;
            }
            if (part.functionCall) {
              return `**Tool Command**:\n\`\`\`json\n${JSON.stringify(
                part.functionCall,
                null,
                2,
              )}\n\`\`\``;
            }
            if (part.functionResponse) {
              return `**Tool Response**:\n\`\`\`json\n${JSON.stringify(
                part.functionResponse,
                null,
                2,
              )}\n\`\`\``;
            }
            return '';
          })
          .join('') || '';
      const roleIcon = item.role === 'user' ? '🧑‍💻' : '✨';
      return `${roleIcon} ## ${(item.role || 'model').toUpperCase()}\n\n${text}`;
    })
    .join('\n\n---\n\n');
}

const shareCommand: SlashCommand = {
  name: 'share',
  description: uiTranslator('commands.chat.share.description'),
  kind: CommandKind.BUILT_IN,
  action: async (context, args): Promise<MessageActionReturn> => {
    let filePathArg = args.trim();
    if (!filePathArg) {
      filePathArg = `gemini-conversation-${Date.now()}.json`;
    }

    const filePath = path.resolve(filePathArg);
    const extension = path.extname(filePath);
    if (extension !== '.md' && extension !== '.json') {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.share.invalidFormat'),
      };
    }

    const chat = await context.services.config?.getGeminiClient()?.getChat();
    if (!chat) {
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.share.noChatClient'),
      };
    }

    const history = chat.getHistory();

    // An empty conversation has two hidden messages that setup the context for
    // the chat. Thus, to check whether a conversation has been started, we
    // can't check for length 0.
    if (history.length <= 2) {
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.share.noConversation'),
      };
    }

    let content = '';
    if (extension === '.json') {
      content = JSON.stringify(history, null, 2);
    } else {
      content = serializeHistoryToMarkdown(history);
    }

    try {
      await fsPromises.writeFile(filePath, content);
      return {
        type: 'message',
        messageType: 'info',
        content: uiTranslator('commands.chat.share.shared', { filePath }),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        type: 'message',
        messageType: 'error',
        content: uiTranslator('commands.chat.share.error', {
          error: errorMessage,
        }),
      };
    }
  },
};

export const chatCommand: SlashCommand = {
  name: 'chat',
  description: uiTranslator('commands.chat.describe'),
  kind: CommandKind.BUILT_IN,
  subCommands: [
    listCommand,
    saveCommand,
    resumeCommand,
    deleteCommand,
    shareCommand,
  ],
};
