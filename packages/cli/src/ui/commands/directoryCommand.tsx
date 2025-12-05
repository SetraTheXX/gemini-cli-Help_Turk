/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isFolderTrustEnabled,
  isWorkspaceTrusted,
  loadTrustedFolders,
} from '../../config/trustedFolders.js';
import { MultiFolderTrustDialog } from '../components/MultiFolderTrustDialog.js';
import type { SlashCommand, CommandContext } from './types.js';
import { CommandKind } from './types.js';
import { MessageType, type HistoryItem } from '../types.js';
import { refreshServerHierarchicalMemory } from '@google/gemini-cli-core';
import { expandHomeDir } from '../utils/directoryUtils.js';
import type { Config } from '@google/gemini-cli-core';
import { uiTranslator } from '../i18n.js';

async function finishAddingDirectories(
  config: Config,
  addItem: (itemData: Omit<HistoryItem, 'id'>, baseTimestamp: number) => number,
  added: string[],
  errors: string[],
) {
  if (!config) {
    addItem(
      {
        type: MessageType.ERROR,
        text: uiTranslator('ui.commands.directory.configUnavailable'),
      },
      Date.now(),
    );
    return;
  }

  try {
    if (config.shouldLoadMemoryFromIncludeDirectories()) {
      await refreshServerHierarchicalMemory(config);
    }
    addItem(
      {
        type: MessageType.INFO,
        text: uiTranslator('ui.commands.directory.add.geminiFilesAdded', {
          directories: added.join('\n- '),
        }),
      },
      Date.now(),
    );
  } catch (error) {
    errors.push(
      uiTranslator('ui.commands.directory.add.refreshError', {
        message: (error as Error).message,
      }),
    );
  }

  if (added.length > 0) {
    const gemini = config.getGeminiClient();
    if (gemini) {
      await gemini.addDirectoryContext();
    }
    addItem(
      {
        type: MessageType.INFO,
        text: uiTranslator('ui.commands.directory.add.addedDirectories', {
          directories: added.join('\n- '),
        }),
      },
      Date.now(),
    );
  }

  if (errors.length > 0) {
    addItem({ type: MessageType.ERROR, text: errors.join('\n') }, Date.now());
  }
}

export const directoryCommand: SlashCommand = {
  name: 'directory',
  altNames: ['dir'],
  description: uiTranslator('ui.commands.directory.description'),
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'add',
      description: uiTranslator('ui.commands.directory.add.description'),
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        const {
          ui: { addItem },
          services: { config, settings },
        } = context;
        const [...rest] = args.split(' ');

        if (!config) {
          addItem(
            {
              type: MessageType.ERROR,
              text: uiTranslator('ui.commands.directory.configUnavailable'),
            },
            Date.now(),
          );
          return;
        }

        if (config.isRestrictiveSandbox()) {
          return {
            type: 'message' as const,
            messageType: 'error' as const,
            content: uiTranslator(
              'ui.commands.directory.add.restrictiveSandbox',
            ),
          };
        }

        const pathsToAdd = rest
          .join(' ')
          .split(',')
          .filter((p) => p);
        if (pathsToAdd.length === 0) {
          addItem(
            {
              type: MessageType.ERROR,
              text: uiTranslator('ui.commands.directory.add.missingPath'),
            },
            Date.now(),
          );
          return;
        }

        const added: string[] = [];
        const errors: string[] = [];
        const alreadyAdded: string[] = [];

        const workspaceContext = config.getWorkspaceContext();
        const currentWorkspaceDirs = workspaceContext.getDirectories();
        const pathsToProcess: string[] = [];

        for (const pathToAdd of pathsToAdd) {
          const expandedPath = expandHomeDir(pathToAdd.trim());
          if (currentWorkspaceDirs.includes(expandedPath)) {
            alreadyAdded.push(pathToAdd.trim());
          } else {
            pathsToProcess.push(pathToAdd.trim());
          }
        }

        if (alreadyAdded.length > 0) {
          addItem(
            {
              type: MessageType.INFO,
              text: uiTranslator(
                'ui.commands.directory.add.alreadyInWorkspace',
                {
                  directories: alreadyAdded.join('\n- '),
                },
              ),
            },
            Date.now(),
          );
        }

        if (pathsToProcess.length === 0) {
          return;
        }

        if (
          isFolderTrustEnabled(settings.merged) &&
          isWorkspaceTrusted(settings.merged).isTrusted
        ) {
          const trustedFolders = loadTrustedFolders();
          const untrustedDirs: string[] = [];
          const undefinedTrustDirs: string[] = [];
          const trustedDirs: string[] = [];

          for (const pathToAdd of pathsToProcess) {
            const expandedPath = expandHomeDir(pathToAdd.trim());
            const isTrusted = trustedFolders.isPathTrusted(expandedPath);
            if (isTrusted === false) {
              untrustedDirs.push(pathToAdd.trim());
            } else if (isTrusted === undefined) {
              undefinedTrustDirs.push(pathToAdd.trim());
            } else {
              trustedDirs.push(pathToAdd.trim());
            }
          }

          if (untrustedDirs.length > 0) {
            errors.push(
              uiTranslator('ui.commands.directory.add.untrustedDirectories', {
                directories: untrustedDirs.join('\n- '),
              }),
            );
          }

          for (const pathToAdd of trustedDirs) {
            try {
              workspaceContext.addDirectory(expandHomeDir(pathToAdd));
              added.push(pathToAdd);
            } catch (e) {
              const error = e as Error;
              errors.push(
                uiTranslator('ui.commands.directory.add.addError', {
                  directory: pathToAdd,
                  message: error.message,
                }),
              );
            }
          }

          if (undefinedTrustDirs.length > 0) {
            return {
              type: 'custom_dialog',
              component: (
                <MultiFolderTrustDialog
                  folders={undefinedTrustDirs}
                  onComplete={context.ui.removeComponent}
                  trustedDirs={added}
                  errors={errors}
                  finishAddingDirectories={finishAddingDirectories}
                  config={config}
                  addItem={addItem}
                />
              ),
            };
          }
        } else {
          for (const pathToAdd of pathsToProcess) {
            try {
              workspaceContext.addDirectory(expandHomeDir(pathToAdd.trim()));
              added.push(pathToAdd.trim());
            } catch (e) {
              const error = e as Error;
              errors.push(
                uiTranslator('ui.commands.directory.add.addError', {
                  directory: pathToAdd.trim(),
                  message: error.message,
                }),
              );
            }
          }
        }

        await finishAddingDirectories(config, addItem, added, errors);
        return;
      },
    },
    {
      name: 'show',
      description: uiTranslator('ui.commands.directory.list.description'),
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        const {
          ui: { addItem },
          services: { config },
        } = context;
        if (!config) {
          addItem(
            {
              type: MessageType.ERROR,
              text: uiTranslator('ui.commands.directory.configUnavailable'),
            },
            Date.now(),
          );
          return;
        }
        const workspaceContext = config.getWorkspaceContext();
        const directories = workspaceContext.getDirectories();
        const directoryList = directories.map((dir) => `- ${dir}`).join('\n');
        addItem(
          {
            type: MessageType.INFO,
            text: uiTranslator('ui.commands.directory.list.directories', {
              directories: directoryList,
            }),
          },
          Date.now(),
        );
      },
    },
  ],
};
