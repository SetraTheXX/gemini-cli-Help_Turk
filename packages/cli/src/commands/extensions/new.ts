/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { access, cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import type { CommandModule } from 'yargs';
import { fileURLToPath } from 'node:url';
import { debugLogger } from '@google/gemini-cli-core';
import { createTranslator, type Translator } from '../../i18n/index.js';
import { detectLocale } from '../../utils/locale.js';

interface NewArgs {
  path: string;
  template?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXAMPLES_PATH = join(__dirname, 'examples');

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch (_e) {
    return false;
  }
}

async function createDirectory(path: string, t: Translator) {
  if (await pathExists(path)) {
    throw new Error(t('extensions.new.errors.pathExists', { path }));
  }
  await mkdir(path, { recursive: true });
}

async function copyDirectory(template: string, path: string, t: Translator) {
  await createDirectory(path, t);

  const examplePath = join(EXAMPLES_PATH, template);
  const entries = await readdir(examplePath, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(examplePath, entry.name);
    const destPath = join(path, entry.name);
    await cp(srcPath, destPath, { recursive: true });
  }
}

async function handleNew(
  args: NewArgs,
  t: Translator = createTranslator(detectLocale(process.env, 'en')),
) {
  if (args.template) {
    await copyDirectory(args.template, args.path, t);
    debugLogger.log(
      t('extensions.new.logs.templateCreated', {
        template: args.template,
        path: args.path,
      }),
    );
  } else {
    await createDirectory(args.path, t);
    const extensionName = basename(args.path);
    const manifest = {
      name: extensionName,
      version: '1.0.0',
    };
    await writeFile(
      join(args.path, 'gemini-extension.json'),
      JSON.stringify(manifest, null, 2),
    );
    debugLogger.log(
      t('extensions.new.logs.created', {
        path: args.path,
      }),
    );
  }
  debugLogger.log(t('extensions.new.logs.installHint', { path: args.path }));
}

async function getBoilerplateChoices() {
  const entries = await readdir(EXAMPLES_PATH, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function createNewCommand(t: Translator): CommandModule {
  return {
    command: 'new <path> [template]',
    describe: t('extensions.new.describe'),
    builder: async (yargs) => {
      const choices = await getBoilerplateChoices();
      return yargs
        .positional('path', {
          describe: t('extensions.new.path'),
          type: 'string',
        })
        .positional('template', {
          describe: t('extensions.new.template'),
          type: 'string',
          choices,
        });
    },
    handler: async (args) => {
      await handleNew(
        {
          path: args['path'] as string,
          template: args['template'] as string | undefined,
        },
        t,
      );
    },
  };
}

const defaultTranslator = createTranslator(detectLocale(process.env, 'en'));

export const newCommand = createNewCommand(defaultTranslator);
