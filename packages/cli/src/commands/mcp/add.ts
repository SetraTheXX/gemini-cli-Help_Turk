/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File for 'gemini mcp add' command
import type { CommandModule } from 'yargs';
import { loadSettings, SettingScope } from '../../config/settings.js';
import { debugLogger, type MCPServerConfig } from '@google/gemini-cli-core';
import { t } from '../../i18n/index.js';

async function addMcpServer(
  name: string,
  commandOrUrl: string,
  args: Array<string | number> | undefined,
  options: {
    scope: string;
    transport: string;
    env: string[] | undefined;
    header: string[] | undefined;
    timeout?: number;
    trust?: boolean;
    description?: string;
    includeTools?: string[];
    excludeTools?: string[];
  },
) {
  const {
    scope,
    transport,
    env,
    header,
    timeout,
    trust,
    description,
    includeTools,
    excludeTools,
  } = options;

  const settings = loadSettings(process.cwd());
  const inHome = settings.workspace.path === settings.user.path;

  if (scope === 'project' && inHome) {
    debugLogger.error(
      t('commands.mcp.add.scopeHomeError'),
    );
    process.exit(1);
  }

  const settingsScope =
    scope === 'user' ? SettingScope.User : SettingScope.Workspace;

  let newServer: Partial<MCPServerConfig> = {};

  const headers = header?.reduce(
    (acc, curr) => {
      const [key, ...valueParts] = curr.split(':');
      const value = valueParts.join(':').trim();
      if (key.trim() && value) {
        acc[key.trim()] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  switch (transport) {
    case 'sse':
      newServer = {
        url: commandOrUrl,
        headers,
        timeout,
        trust,
        description,
        includeTools,
        excludeTools,
      };
      break;
    case 'http':
      newServer = {
        httpUrl: commandOrUrl,
        headers,
        timeout,
        trust,
        description,
        includeTools,
        excludeTools,
      };
      break;
    case 'stdio':
    default:
      newServer = {
        command: commandOrUrl,
        args: args?.map(String),
        env: env?.reduce(
          (acc, curr) => {
            const [key, value] = curr.split('=');
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
        timeout,
        trust,
        description,
        includeTools,
        excludeTools,
      };
      break;
  }

  const existingSettings = settings.forScope(settingsScope).settings;
  const mcpServers = existingSettings.mcpServers || {};

  const isExistingServer = !!mcpServers[name];
  if (isExistingServer) {
    debugLogger.log(
      t('commands.mcp.add.exists', { name, scope }),
    );
  }

  mcpServers[name] = newServer as MCPServerConfig;

  settings.setValue(settingsScope, 'mcpServers', mcpServers);

  if (isExistingServer) {
    debugLogger.log(t('commands.mcp.add.updated', { name, scope }));
  } else {
    debugLogger.log(
      t('commands.mcp.add.added', { name, scope, transport }),
    );
  }
}

export const addCommand: CommandModule = {
  command: 'add <name> <commandOrUrl> [args...]',
  describe: t('commands.mcp.add.describe'),
  builder: (yargs) =>
    yargs
      .usage(t('commands.mcp.add.usage'))
      .parserConfiguration({
        'unknown-options-as-args': true, // Pass unknown options as server args
        'populate--': true, // Populate server args after -- separator
      })
      .positional('name', {
        describe: t('commands.mcp.add.name'),
        type: 'string',
        demandOption: true,
      })
      .positional('commandOrUrl', {
        describe: t('commands.mcp.add.commandOrUrl'),
        type: 'string',
        demandOption: true,
      })
      .option('scope', {
        alias: 's',
        describe: t('commands.mcp.add.scope'),
        type: 'string',
        default: 'project',
        choices: ['user', 'project'],
      })
      .option('transport', {
        alias: 't',
        describe: t('commands.mcp.add.transport'),
        type: 'string',
        default: 'stdio',
        choices: ['stdio', 'sse', 'http'],
      })
      .option('env', {
        alias: 'e',
        describe: t('commands.mcp.add.env'),
        type: 'array',
        string: true,
        nargs: 1,
      })
      .option('header', {
        alias: 'H',
        describe:
          t('commands.mcp.add.header'),
        type: 'array',
        string: true,
        nargs: 1,
      })
      .option('timeout', {
        describe: t('commands.mcp.add.timeout'),
        type: 'number',
      })
      .option('trust', {
        describe: t('commands.mcp.add.trust'),
        type: 'boolean',
      })
      .option('description', {
        describe: t('commands.mcp.add.description'),
        type: 'string',
      })
      .option('include-tools', {
        describe: t('commands.mcp.add.includeTools'),
        type: 'array',
        string: true,
      })
      .option('exclude-tools', {
        describe: t('commands.mcp.add.excludeTools'),
        type: 'array',
        string: true,
      })
      .middleware((argv) => {
        // Handle -- separator args as server args if present
        if (argv['--']) {
          const existingArgs = (argv['args'] as Array<string | number>) || [];
          argv['args'] = [...existingArgs, ...(argv['--'] as string[])];
        }
      }),
  handler: async (argv) => {
    await addMcpServer(
      argv['name'] as string,
      argv['commandOrUrl'] as string,
      argv['args'] as Array<string | number>,
      {
        scope: argv['scope'] as string,
        transport: argv['transport'] as string,
        env: argv['env'] as string[],
        header: argv['header'] as string[],
        timeout: argv['timeout'] as number | undefined,
        trust: argv['trust'] as boolean | undefined,
        description: argv['description'] as string | undefined,
        includeTools: argv['includeTools'] as string[] | undefined,
        excludeTools: argv['excludeTools'] as string[] | undefined,
      },
    );
  },
};
