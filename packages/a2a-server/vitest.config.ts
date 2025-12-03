/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vitest" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreSourceEntry = path.resolve(__dirname, '../core/src/index.ts');

export default defineConfig({
  resolve: {
    alias: {
      '@google/gemini-cli-core': coreSourceEntry,
    },
  },
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    reporters: ['default', 'junit'],
    silent: true,
    outputFile: {
      junit: 'junit.xml',
    },
    coverage: {
      // The coverage stack (test-exclude/path-scurry) pulls in lru-cache APIs
      // that are incompatible with the version pinned in our offline-friendly
      // lockfile when running on newer Node.js runtimes. Keep coverage
      // opt-in for now unless explicitly forced via COVERAGE=true, and allow
      // disabling with COVERAGE=false for local runs.
      enabled:
        process.env.COVERAGE === 'true'
          ? true
          : process.env.COVERAGE === 'false'
            ? false
            : Number.parseInt(process.versions.node.split('.')[0], 10) < 22,
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*'],
      reporter: [
        ['text', { file: 'full-text-summary.txt' }],
        'html',
        'json',
        'lcov',
        'cobertura',
        ['json-summary', { outputFile: 'coverage-summary.json' }],
      ],
    },
    poolOptions: {
      threads: {
        minThreads: 8,
        maxThreads: 16,
      },
    },
    server: {
      deps: {
        inline: [/@google\/gemini-cli-core/],
      },
    },
  },
});
