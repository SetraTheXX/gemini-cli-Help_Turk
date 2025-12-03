/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface Category {
  name: string;
  description: string;
  globs: string[];
  outputBasename: string;
}

interface MatchRow {
  text: string;
  file: string;
  line: number;
}

const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../..',
);
const outputDir = path.resolve(repoRoot, 'scripts/i18n/inventory');

const categories: Category[] = [
  {
    name: 'cliHelp',
    description: 'CLI command help and option strings',
    globs: ['packages/cli/src/commands/**'],
    outputBasename: 'cli-help',
  },
  {
    name: 'uiCommands',
    description: 'UI command output strings',
    globs: ['packages/cli/src/ui/commands/**'],
    outputBasename: 'ui-commands',
  },
  {
    name: 'errorsLogs',
    description: 'Error and log messages from source files',
    globs: [
      'packages/**/*.ts',
      'packages/**/*.tsx',
      '!**/*.test.ts',
      '!**/*.test.tsx',
    ],
    outputBasename: 'errors-logs',
  },
  {
    name: 'docs',
    description: 'Documentation strings',
    globs: ['docs/**/*.md', 'README.md', 'ROADMAP.md'],
    outputBasename: 'docs',
  },
];

function runRipgrep(globs: string[]): string {
  const args = [
    '--pcre2',
    '--no-heading',
    '--line-number',
    '-o',
    '"[^"\n]*[A-Za-z][^"\n]*"',
  ];

  globs.forEach((glob) => args.push('--glob', glob));
  args.push('.');

  const result = spawnSync('rg', args, { cwd: repoRoot, encoding: 'utf-8' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && result.stdout.trim().length === 0) {
    throw new Error(`ripgrep failed: ${result.stderr}`);
  }

  return result.stdout;
}

function parseMatches(raw: string): MatchRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [file, lineNumber, ...rest] = line.split(':');
      const text = rest.join(':').trim();
      return {
        text: text.replace(/^"|"$/g, ''),
        file,
        line: Number.parseInt(lineNumber, 10),
      };
    });
}

function writeOutputs(category: Category, matches: MatchRow[]) {
  const jsonPath = path.join(outputDir, `${category.outputBasename}.json`);
  const csvPath = path.join(outputDir, `${category.outputBasename}.csv`);

  writeFileSync(jsonPath, JSON.stringify(matches, null, 2), 'utf-8');

  const csvLines = [
    'text,file,line',
    ...matches.map(
      (m) => `"${m.text.replace(/"/g, '""')}",${m.file},${m.line}`,
    ),
  ];
  writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
}

function collectCategory(category: Category) {
  const output = runRipgrep(category.globs);
  const matches = parseMatches(output);
  writeOutputs(category, matches);
  return { name: category.name, count: matches.length };
}

function main() {
  mkdirSync(outputDir, { recursive: true });

  const summaries = categories.map(collectCategory);
  const summaryPath = path.join(outputDir, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(summaries, null, 2), 'utf-8');
}

main();
