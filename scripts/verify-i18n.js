/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const bundleDir = path.join(rootDir, 'bundle');
const cliPackageDir = path.join(rootDir, 'packages', 'cli');

function assertFilesExist(label, files) {
  const missing = files.filter((file) => !existsSync(file));
  if (missing.length > 0) {
    throw new Error(
      `${label} is missing expected files: ${missing.map((file) => path.relative(rootDir, file)).join(', ')}`,
    );
  }
}

function verifyBundleAssets() {
  const required = [
    path.join(bundleDir, 'i18n', 'en.json'),
    path.join(bundleDir, 'i18n', 'tr.json'),
  ];
  assertFilesExist('Bundle output', required);
}

function ensureCliI18nArtifacts() {
  const sourceLocales = path.join(cliPackageDir, 'src', 'i18n', 'locales');
  const targetLocales = path.join(cliPackageDir, 'dist', 'src', 'i18n', 'locales');

  assertFilesExist('CLI source locales', [
    path.join(sourceLocales, 'en.json'),
    path.join(sourceLocales, 'tr.json'),
  ]);

  mkdirSync(targetLocales, { recursive: true });
  copyFileSync(path.join(sourceLocales, 'en.json'), path.join(targetLocales, 'en.json'));
  copyFileSync(path.join(sourceLocales, 'tr.json'), path.join(targetLocales, 'tr.json'));
}

function verifyPackedFiles() {
  const output = execSync('npm pack --json --dry-run --ignore-scripts', {
    cwd: cliPackageDir,
    encoding: 'utf-8',
  });

  const packInfo = JSON.parse(output)[0];
  const packedPaths = packInfo.files.map((file) =>
    file.path.replace(/^package\//, ''),
  );
  const required = [
    'dist/src/i18n/locales/en.json',
    'dist/src/i18n/locales/tr.json',
  ];

  const missing = required.filter((file) => !packedPaths.includes(file));
  if (missing.length > 0) {
    throw new Error(`npm pack output is missing expected i18n files: ${missing.join(', ')}`);
  }
}

function main() {
  verifyBundleAssets();
  ensureCliI18nArtifacts();
  verifyPackedFiles();
  console.log('i18n assets verified in bundle output and npm pack result.');
}

main();
