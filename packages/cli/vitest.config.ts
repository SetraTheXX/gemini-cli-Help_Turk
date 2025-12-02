/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ['test'],
  },
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}', 'config.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**'],
    environment: 'node',
    globals: true,
    reporters: ['default', 'junit'],

    outputFile: {
      junit: 'junit.xml',
    },
    alias: {
      '@google/gemini-cli-core': path.resolve(
        __dirname,
        '../core/src/index.ts',
      ),
      react: path.resolve(__dirname, '../../node_modules/react'),
    },
    setupFiles: ['./test-setup.ts'],
    coverage: {
      // Vitest's coverage stack currently fails on Node.js 22 because of a
      // transitive path-scurry/test-exclude incompatibility. Disable coverage
      // by default on Node 22+ so tests can run locally; set COVERAGE=true to
      // force-enable when running on a compatible runtime (e.g., Node 20).
      enabled:
        process.env.COVERAGE === 'true'
          ? true
          : Number.parseInt(process.versions.node.split('.')[0], 10) < 22 &&
            process.env.COVERAGE !== 'false',
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
