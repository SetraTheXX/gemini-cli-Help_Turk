/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';
import { mcpCommand } from '../commands/mcp.js';
import type { OutputFormat } from '@google/gemini-cli-core';
import { createExtensionsCommand } from '../commands/extensions.js';
import {
  Config,
  setGeminiMdFilename as setServerGeminiMdFilename,
  getCurrentGeminiMdFilename,
  ApprovalMode,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_MODEL_AUTO,
  DEFAULT_GEMINI_EMBEDDING_MODEL,
  DEFAULT_FILE_FILTERING_OPTIONS,
  DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
  FileDiscoveryService,
  WRITE_FILE_TOOL_NAME,
  SHELL_TOOL_NAMES,
  SHELL_TOOL_NAME,
  resolveTelemetrySettings,
  FatalConfigError,
  getPty,
  EDIT_TOOL_NAME,
  debugLogger,
  loadServerHierarchicalMemory,
} from '@google/gemini-cli-core';
import type { Settings } from './settings.js';

import { getCliVersion } from '../utils/version.js';
import { loadSandboxConfig } from './sandboxConfig.js';
import { resolvePath } from '../utils/resolvePath.js';
import { appEvents } from '../utils/events.js';
import { detectLocale, validateLocale } from '../utils/locale.js';
import { createTranslator } from '../i18n/index.js';

import { isWorkspaceTrusted } from './trustedFolders.js';
import { createPolicyEngineConfig } from './policy.js';
import { ExtensionManager } from './extension-manager.js';
import type { ExtensionEvents } from '@google/gemini-cli-core/src/utils/extensionLoader.js';
import { requestConsentNonInteractive } from './extensions/consent.js';
import { promptForSetting } from './extensions/extensionSettings.js';
import type { EventEmitter } from 'node:stream';

export interface CliArgs {
  query: string | undefined;
  model: string | undefined;
  sandbox: boolean | string | undefined;
  debug: boolean | undefined;
  prompt: string | undefined;
  promptInteractive: string | undefined;

  yolo: boolean | undefined;
  approvalMode: string | undefined;
  allowedMcpServerNames: string[] | undefined;
  allowedTools: string[] | undefined;
  experimentalAcp: boolean | undefined;
  extensions: string[] | undefined;
  listExtensions: boolean | undefined;
  resume: string | 'latest' | undefined;
  listSessions: boolean | undefined;
  deleteSession: string | undefined;
  includeDirectories: string[] | undefined;
  screenReader: boolean | undefined;
  useSmartEdit: boolean | undefined;
  useWriteTodos: boolean | undefined;
  outputFormat: string | undefined;
  fakeResponses: string | undefined;
  recordResponses: string | undefined;
  locale: string | undefined;
}

export async function parseArguments(settings: Settings): Promise<CliArgs> {
  const rawArgv = hideBin(process.argv);
  const defaultLocale = detectLocale(process.env, 'en');
  const t = createTranslator(defaultLocale);
  const yargsInstance = yargs(rawArgv)
    .locale(defaultLocale)
    .scriptName('gemini')
    .usage(t('usage'))

    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: t('options.debug'),
      default: false,
    })
    .command('$0 [query..]', t('commands.mainDescription'), (yargsInstance) =>
      yargsInstance
        .positional('query', {
          description: t('commands.queryDescription'),
        })
        .option('model', {
          alias: 'm',
          type: 'string',
          nargs: 1,
          description: t('options.model'),
        })
        .option('prompt', {
          alias: 'p',
          type: 'string',
          nargs: 1,
          description: t('options.prompt'),
        })
        .option('prompt-interactive', {
          alias: 'i',
          type: 'string',
          nargs: 1,
          description: t('options.promptInteractive'),
        })
        .option('sandbox', {
          alias: 's',
          type: 'boolean',
          description: t('options.sandbox'),
        })

        .option('yolo', {
          alias: 'y',
          type: 'boolean',
          description: t('options.yolo'),
          default: false,
        })
        .option('approval-mode', {
          type: 'string',
          nargs: 1,
          choices: ['default', 'auto_edit', 'yolo'],
          description: t('options.approvalMode'),
        })
        .option('experimental-acp', {
          type: 'boolean',
          description: t('options.experimentalAcp'),
        })
        .option('allowed-mcp-server-names', {
          type: 'array',
          string: true,
          nargs: 1,
          description: t('options.allowedMcpServerNames'),
          coerce: (mcpServerNames: string[]) =>
            // Handle comma-separated values
            mcpServerNames.flatMap((mcpServerName) =>
              mcpServerName.split(',').map((m) => m.trim()),
            ),
        })
        .option('allowed-tools', {
          type: 'array',
          string: true,
          nargs: 1,
          description: t('options.allowedTools'),
          coerce: (tools: string[]) =>
            // Handle comma-separated values
            tools.flatMap((tool) => tool.split(',').map((t) => t.trim())),
        })
        .option('extensions', {
          alias: 'e',
          type: 'array',
          string: true,
          nargs: 1,
          description: t('options.extensions'),
          coerce: (extensions: string[]) =>
            // Handle comma-separated values
            extensions.flatMap((extension) =>
              extension.split(',').map((e) => e.trim()),
            ),
        })
        .option('list-extensions', {
          alias: 'l',
          type: 'boolean',
          description: t('options.listExtensions'),
        })
        .option('resume', {
          alias: 'r',
          type: 'string',
          // `skipValidation` so that we can distinguish between it being passed with a value, without
          // one, and not being passed at all.
          skipValidation: true,
          description: t('options.resume'),
          coerce: (value: string): string => {
            // When --resume passed with a value (`gemini --resume 123`): value = "123" (string)
            // When --resume passed without a value (`gemini --resume`): value = "" (string)
            // When --resume not passed at all: this `coerce` function is not called at all, and
            //   `yargsInstance.argv.resume` is undefined.
            if (value === '') {
              return 'latest';
            }
            return value;
          },
        })
        .option('list-sessions', {
          type: 'boolean',
          description: t('options.listSessions'),
        })
        .option('delete-session', {
          type: 'string',
          description: t('options.deleteSession'),
        })
        .option('include-directories', {
          type: 'array',
          string: true,
          nargs: 1,
          description: t('options.includeDirectories'),
          coerce: (dirs: string[]) =>
            // Handle comma-separated values
            dirs.flatMap((dir) => dir.split(',').map((d) => d.trim())),
        })
        .option('screen-reader', {
          type: 'boolean',
          description: t('options.screenReader'),
        })
        .option('output-format', {
          alias: 'o',
          type: 'string',
          nargs: 1,
          description: t('options.outputFormat'),
          choices: ['text', 'json', 'stream-json'],
        })
        .option('locale', {
          alias: 'L',
          type: 'string',
          description: t('options.locale'),
          default: defaultLocale,
          coerce: validateLocale,
        })
        .option('fake-responses', {
          type: 'string',
          description: t('options.fakeResponses'),
          hidden: true,
        })
        .option('record-responses', {
          type: 'string',
          description: t('options.recordResponses'),
          hidden: true,
        })
        .deprecateOption('prompt', t('options.promptDeprecation'))
        // Ensure validation flows through .fail() for clean UX
        .fail((msg, err, yargs) => {
          const fallbackMessage = t('errors.unknown');
          const error = err ?? new Error(msg || fallbackMessage);
          const message = msg || error.message || fallbackMessage;
          const errorMessage =
            typeof error?.message === 'string' && error.message.trim()
              ? error.message
              : message;
          const localizedMessage = errorMessage.includes('Invalid locale value')
            ? errorMessage.includes('expected a non-empty string')
              ? t('errors.invalidLocaleMissing')
              : t('errors.invalidLocaleValue', {
                  value: errorMessage.split(': ')[1] ?? '',
                })
            : errorMessage;
          console.error(localizedMessage);
          debugLogger.error(localizedMessage);
          yargs.showHelp();
          if (errorMessage.includes('Invalid locale value')) {
            throw new Error(localizedMessage);
          }
          process.exit(1);
        })
        .check((argv) => {
          // The 'query' positional can be a string (for one arg) or string[] (for multiple).
          // This guard safely checks if any positional argument was provided.
          const query = argv['query'] as string | string[] | undefined;
          const hasPositionalQuery = Array.isArray(query)
            ? query.length > 0
            : !!query;

          if (argv['prompt'] && hasPositionalQuery) {
            return t('errors.promptAndQuery');
          }
          if (argv['prompt'] && argv['promptInteractive']) {
            return t('errors.promptAndInteractive');
          }
          if (argv.resume && !argv.prompt && !process.stdin.isTTY) {
            throw new Error(t('errors.resumeNeedsInput'));
          }
          if (argv.yolo && argv['approvalMode']) {
            return t('errors.yoloAndApproval');
          }
          return true;
        }),
    )
    // Register MCP subcommands
    .command(mcpCommand);

  if (settings?.experimental?.extensionManagement ?? true) {
    yargsInstance.command(createExtensionsCommand(t));
  }

  yargsInstance
    .version(await getCliVersion()) // This will enable the --version flag based on package.json
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .strict()
    .demandCommand(0, 0); // Allow base command to run with no subcommands

  yargsInstance.wrap(yargsInstance.terminalWidth());
  const result = await yargsInstance.parse();

  // If yargs handled --help/--version it will have exited; nothing to do here.

  // Handle case where MCP subcommands are executed - they should exit the process
  // and not return to main CLI logic
  if (
    result._.length > 0 &&
    (result._[0] === 'mcp' || result._[0] === 'extensions')
  ) {
    // MCP commands handle their own execution and process exit
    process.exit(0);
  }

  // Normalize query args: handle both quoted "@path file" and unquoted @path file
  const queryArg = (result as { query?: string | string[] | undefined }).query;
  const q: string | undefined = Array.isArray(queryArg)
    ? queryArg.join(' ')
    : queryArg;

  // Route positional args: explicit -i flag -> interactive; else -> one-shot (even for @commands)
  if (q && !result['prompt']) {
    const hasExplicitInteractive =
      result['promptInteractive'] === '' || !!result['promptInteractive'];
    if (hasExplicitInteractive) {
      result['promptInteractive'] = q;
    } else {
      result['prompt'] = q;
    }
  }

  // Keep CliArgs.query as a string for downstream typing
  (result as Record<string, unknown>)['query'] = q || undefined;

  // The import format is now only controlled by settings.memoryImportFormat
  // We no longer accept it as a CLI argument
  return result as unknown as CliArgs;
}

/**
 * Creates a filter function to determine if a tool should be excluded.
 *
 * In non-interactive mode, we want to disable tools that require user
 * interaction to prevent the CLI from hanging. This function creates a predicate
 * that returns `true` if a tool should be excluded.
 *
 * A tool is excluded if it's not in the `allowedToolsSet`. The shell tool
 * has a special case: it's not excluded if any of its subcommands
 * are in the `allowedTools` list.
 *
 * @param allowedTools A list of explicitly allowed tool names.
 * @param allowedToolsSet A set of explicitly allowed tool names for quick lookups.
 * @returns A function that takes a tool name and returns `true` if it should be excluded.
 */
function createToolExclusionFilter(
  allowedTools: string[],
  allowedToolsSet: Set<string>,
) {
  return (tool: string): boolean => {
    if (tool === SHELL_TOOL_NAME) {
      // If any of the allowed tools is ShellTool (even with subcommands), don't exclude it.
      return !allowedTools.some((allowed) =>
        SHELL_TOOL_NAMES.some((shellName) => allowed.startsWith(shellName)),
      );
    }
    return !allowedToolsSet.has(tool);
  };
}

export function isDebugMode(argv: CliArgs): boolean {
  return (
    argv.debug ||
    [process.env['DEBUG'], process.env['DEBUG_MODE']].some(
      (v) => v === 'true' || v === '1',
    )
  );
}

export async function loadCliConfig(
  settings: Settings,
  sessionId: string,
  argv: CliArgs,
  cwd: string = process.cwd(),
): Promise<Config> {
  const debugMode = isDebugMode(argv);

  if (argv.sandbox) {
    process.env['GEMINI_SANDBOX'] = 'true';
  }

  const memoryImportFormat = settings.context?.importFormat || 'tree';

  const ideMode = settings.ide?.enabled ?? false;

  const folderTrust = settings.security?.folderTrust?.enabled ?? false;
  const trustedFolder = isWorkspaceTrusted(settings)?.isTrusted ?? true;

  // Set the context filename in the server's memoryTool module BEFORE loading memory
  // TODO(b/343434939): This is a bit of a hack. The contextFileName should ideally be passed
  // directly to the Config constructor in core, and have core handle setGeminiMdFilename.
  // However, loadHierarchicalGeminiMemory is called *before* createServerConfig.
  if (settings.context?.fileName) {
    setServerGeminiMdFilename(settings.context.fileName);
  } else {
    // Reset to default if not provided in settings.
    setServerGeminiMdFilename(getCurrentGeminiMdFilename());
  }

  const fileService = new FileDiscoveryService(cwd);

  const memoryFileFiltering = {
    ...DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
    ...settings.context?.fileFiltering,
  };

  const fileFiltering = {
    ...DEFAULT_FILE_FILTERING_OPTIONS,
    ...settings.context?.fileFiltering,
  };

  const includeDirectories = (settings.context?.includeDirectories || [])
    .map(resolvePath)
    .concat((argv.includeDirectories || []).map(resolvePath));

  const extensionManager = new ExtensionManager({
    settings,
    requestConsent: requestConsentNonInteractive,
    requestSetting: promptForSetting,
    workspaceDir: cwd,
    enabledExtensionOverrides: argv.extensions,
    eventEmitter: appEvents as EventEmitter<ExtensionEvents>,
  });
  await extensionManager.loadExtensions();

  // Call the (now wrapper) loadHierarchicalGeminiMemory which calls the server's version
  const { memoryContent, fileCount, filePaths } =
    await loadServerHierarchicalMemory(
      cwd,
      [],
      debugMode,
      fileService,
      extensionManager,
      trustedFolder,
      memoryImportFormat,
      memoryFileFiltering,
      settings.context?.discoveryMaxDirs,
    );

  const question = argv.promptInteractive || argv.prompt || '';

  // Determine approval mode with backward compatibility
  let approvalMode: ApprovalMode;
  if (argv.approvalMode) {
    // New --approval-mode flag takes precedence
    switch (argv.approvalMode) {
      case 'yolo':
        approvalMode = ApprovalMode.YOLO;
        break;
      case 'auto_edit':
        approvalMode = ApprovalMode.AUTO_EDIT;
        break;
      case 'default':
        approvalMode = ApprovalMode.DEFAULT;
        break;
      default:
        throw new Error(
          `Invalid approval mode: ${argv.approvalMode}. Valid values are: yolo, auto_edit, default`,
        );
    }
  } else {
    // Fallback to legacy --yolo flag behavior
    approvalMode =
      argv.yolo || false ? ApprovalMode.YOLO : ApprovalMode.DEFAULT;
  }

  // Override approval mode if disableYoloMode is set.
  if (settings.security?.disableYoloMode) {
    if (approvalMode === ApprovalMode.YOLO) {
      debugLogger.error('YOLO mode is disabled by the "disableYolo" setting.');
      throw new FatalConfigError(
        'Cannot start in YOLO mode when it is disabled by settings',
      );
    }
    approvalMode = ApprovalMode.DEFAULT;
  } else if (approvalMode === ApprovalMode.YOLO) {
    debugLogger.warn(
      'YOLO mode is enabled. All tool calls will be automatically approved.',
    );
  }

  // Force approval mode to default if the folder is not trusted.
  if (!trustedFolder && approvalMode !== ApprovalMode.DEFAULT) {
    debugLogger.warn(
      `Approval mode overridden to "default" because the current folder is not trusted.`,
    );
    approvalMode = ApprovalMode.DEFAULT;
  }

  let telemetrySettings;
  try {
    telemetrySettings = await resolveTelemetrySettings({
      env: process.env as unknown as Record<string, string | undefined>,
      settings: settings.telemetry,
    });
  } catch (err) {
    if (err instanceof FatalConfigError) {
      throw new FatalConfigError(
        `Invalid telemetry configuration: ${err.message}.`,
      );
    }
    throw err;
  }

  const policyEngineConfig = await createPolicyEngineConfig(
    settings,
    approvalMode,
  );

  const enableMessageBusIntegration =
    settings.tools?.enableMessageBusIntegration ?? false;

  const allowedTools = argv.allowedTools || settings.tools?.allowed || [];
  const allowedToolsSet = new Set(allowedTools);

  // Interactive mode: explicit -i flag or (TTY + no args + no -p flag)
  const hasQuery = !!argv.query;
  const interactive =
    !!argv.promptInteractive ||
    (process.stdin.isTTY && !hasQuery && !argv.prompt);
  // In non-interactive mode, exclude tools that require a prompt.
  const extraExcludes: string[] = [];
  if (!interactive && !argv.experimentalAcp) {
    const defaultExcludes = [
      SHELL_TOOL_NAME,
      EDIT_TOOL_NAME,
      WRITE_FILE_TOOL_NAME,
    ];
    const autoEditExcludes = [SHELL_TOOL_NAME];

    const toolExclusionFilter = createToolExclusionFilter(
      allowedTools,
      allowedToolsSet,
    );

    switch (approvalMode) {
      case ApprovalMode.DEFAULT:
        // In default non-interactive mode, all tools that require approval are excluded.
        extraExcludes.push(...defaultExcludes.filter(toolExclusionFilter));
        break;
      case ApprovalMode.AUTO_EDIT:
        // In auto-edit non-interactive mode, only tools that still require a prompt are excluded.
        extraExcludes.push(...autoEditExcludes.filter(toolExclusionFilter));
        break;
      case ApprovalMode.YOLO:
        // No extra excludes for YOLO mode.
        break;
      default:
        // This should never happen due to validation earlier, but satisfies the linter
        break;
    }
  }

  const excludeTools = mergeExcludeTools(
    settings,
    extraExcludes.length > 0 ? extraExcludes : undefined,
  );

  const useModelRouter = settings.experimental?.useModelRouter ?? true;
  const defaultModel = useModelRouter
    ? DEFAULT_GEMINI_MODEL_AUTO
    : DEFAULT_GEMINI_MODEL;
  const resolvedModel: string =
    argv.model ||
    process.env['GEMINI_MODEL'] ||
    settings.model?.name ||
    defaultModel;

  const sandboxConfig = await loadSandboxConfig(settings, argv);
  const screenReader =
    argv.screenReader !== undefined
      ? argv.screenReader
      : (settings.ui?.accessibility?.screenReader ?? false);

  const ptyInfo = await getPty();

  return new Config({
    sessionId,
    embeddingModel: DEFAULT_GEMINI_EMBEDDING_MODEL,
    sandbox: sandboxConfig,
    targetDir: cwd,
    includeDirectories,
    loadMemoryFromIncludeDirectories:
      settings.context?.loadMemoryFromIncludeDirectories || false,
    debugMode,
    question,

    coreTools: settings.tools?.core || undefined,
    allowedTools: allowedTools.length > 0 ? allowedTools : undefined,
    policyEngineConfig,
    excludeTools,
    toolDiscoveryCommand: settings.tools?.discoveryCommand,
    toolCallCommand: settings.tools?.callCommand,
    mcpServerCommand: settings.mcp?.serverCommand,
    mcpServers: settings.mcpServers,
    allowedMcpServers: argv.allowedMcpServerNames ?? settings.mcp?.allowed,
    blockedMcpServers: argv.allowedMcpServerNames
      ? [] // explicitly allowed servers overrides everything
      : settings.mcp?.excluded,
    userMemory: memoryContent,
    geminiMdFileCount: fileCount,
    geminiMdFilePaths: filePaths,
    approvalMode,
    disableYoloMode: settings.security?.disableYoloMode,
    showMemoryUsage: settings.ui?.showMemoryUsage || false,
    accessibility: {
      ...settings.ui?.accessibility,
      screenReader,
    },
    telemetry: telemetrySettings,
    usageStatisticsEnabled: settings.privacy?.usageStatisticsEnabled ?? true,
    fileFiltering,
    checkpointing: settings.general?.checkpointing?.enabled,
    proxy:
      process.env['HTTPS_PROXY'] ||
      process.env['https_proxy'] ||
      process.env['HTTP_PROXY'] ||
      process.env['http_proxy'],
    cwd,
    fileDiscoveryService: fileService,
    bugCommand: settings.advanced?.bugCommand,
    model: resolvedModel,
    maxSessionTurns: settings.model?.maxSessionTurns ?? -1,
    experimentalZedIntegration: argv.experimentalAcp || false,
    listExtensions: argv.listExtensions || false,
    listSessions: argv.listSessions || false,
    deleteSession: argv.deleteSession,
    enabledExtensions: argv.extensions,
    extensionLoader: extensionManager,
    enableExtensionReloading: settings.experimental?.extensionReloading,
    noBrowser: !!process.env['NO_BROWSER'],
    summarizeToolOutput: settings.model?.summarizeToolOutput,
    ideMode,
    compressionThreshold: settings.model?.compressionThreshold,
    folderTrust,
    interactive,
    trustedFolder,
    useRipgrep: settings.tools?.useRipgrep,
    enableInteractiveShell:
      settings.tools?.shell?.enableInteractiveShell ?? true,
    skipNextSpeakerCheck: settings.model?.skipNextSpeakerCheck,
    enablePromptCompletion: settings.general?.enablePromptCompletion ?? false,
    truncateToolOutputThreshold: settings.tools?.truncateToolOutputThreshold,
    truncateToolOutputLines: settings.tools?.truncateToolOutputLines,
    enableToolOutputTruncation: settings.tools?.enableToolOutputTruncation,
    eventEmitter: appEvents,
    useSmartEdit: argv.useSmartEdit ?? settings.useSmartEdit,
    useWriteTodos: argv.useWriteTodos ?? settings.useWriteTodos,
    output: {
      format: (argv.outputFormat ?? settings.output?.format) as OutputFormat,
    },
    useModelRouter,
    enableMessageBusIntegration,
    codebaseInvestigatorSettings:
      settings.experimental?.codebaseInvestigatorSettings,
    fakeResponses: argv.fakeResponses,
    recordResponses: argv.recordResponses,
    retryFetchErrors: settings.general?.retryFetchErrors ?? false,
    ptyInfo: ptyInfo?.name,
    modelConfigServiceConfig: settings.modelConfigs,
    // TODO: loading of hooks based on workspace trust
    enableHooks: settings.tools?.enableHooks ?? false,
    hooks: settings.hooks || {},
  });
}

function mergeExcludeTools(
  settings: Settings,
  extraExcludes?: string[] | undefined,
): string[] {
  const allExcludeTools = new Set([
    ...(settings.tools?.exclude || []),
    ...(extraExcludes || []),
  ]);
  return [...allExcludeTools];
}
