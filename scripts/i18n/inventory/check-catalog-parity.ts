/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface CatalogDiff {
  missingInTr: string[];
  missingInEn: string[];
}

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, nextKey);
    }
    return nextKey;
  });
}

function readCatalog(catalogPath: string) {
  const content = readFileSync(catalogPath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

function calculateDiffs(enPath: string, trPath: string): CatalogDiff {
  const enCatalog = readCatalog(enPath);
  const trCatalog = readCatalog(trPath);

  const enKeys = new Set(flattenKeys(enCatalog));
  const trKeys = new Set(flattenKeys(trCatalog));

  const missingInTr = [...enKeys].filter((key) => !trKeys.has(key)).sort();
  const missingInEn = [...trKeys].filter((key) => !enKeys.has(key)).sort();

  return { missingInTr, missingInEn };
}

function main() {
  const repoRoot = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../..',
  );
  const enPath = path.join(repoRoot, 'packages/cli/src/i18n/messages/en.json');
  const trPath = path.join(repoRoot, 'packages/cli/src/i18n/messages/tr.json');
  const outputPath = path.join(
    repoRoot,
    'scripts/i18n/inventory/catalog-parity.json',
  );

  const diffs = calculateDiffs(enPath, trPath);
  writeFileSync(outputPath, JSON.stringify(diffs, null, 2));

  if (diffs.missingInTr.length || diffs.missingInEn.length) {
    console.error(
      'Translation catalogs have missing keys. See catalog-parity.json for details.',
    );
    process.exitCode = 1;
    return;
  }

  console.log('Translation catalogs are in parity.');
}

main();
