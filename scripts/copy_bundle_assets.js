/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bundleDir = join(root, 'bundle');

// Create the bundle directory if it doesn't exist
if (!existsSync(bundleDir)) {
  mkdirSync(bundleDir);
}

// Find and copy all .sb files from packages to the root of the bundle directory
const sbFiles = glob.sync('packages/**/*.sb', { cwd: root });
for (const file of sbFiles) {
  copyFileSync(join(root, file), join(bundleDir, basename(file)));
}

// Copy i18n bundles into bundle/i18n
const i18nSourceDir = join(root, 'packages', 'cli', 'src', 'i18n');
const i18nBundleDir = join(bundleDir, 'i18n');
if (existsSync(i18nSourceDir)) {
  mkdirSync(i18nBundleDir, { recursive: true });
  const localeFiles = glob.sync('**/*.json', { cwd: i18nSourceDir });
  for (const file of localeFiles) {
    const sourcePath = join(i18nSourceDir, file);
    const targetPath = join(i18nBundleDir, file);
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

console.log('Assets copied to bundle/');
