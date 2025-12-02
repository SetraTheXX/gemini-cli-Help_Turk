/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
// Shim Ajv v8 so ESLint's Ajv v6 expectations do not throw.
const Module = require('module');

const originalRequire = Module.prototype.require;

Module.prototype.require = function patchedRequire(id) {
  if (id === 'ajv/lib/refs/json-schema-draft-04.json') {
    return originalRequire.call(this, 'ajv/dist/refs/json-schema-draft-06.json');
  }

  const loaded = originalRequire.apply(this, arguments);
  if (id !== 'ajv') {
    return loaded;
  }

  const Ajv = loaded.default ?? loaded;

  function PatchedAjv(options = {}) {
    const merged = { strict: false, ...options };
    const instance = new Ajv(merged);
    if (instance._opts === undefined) {
      instance._opts = instance.opts ?? instance.options ?? {};
    }
    return instance;
  }

  PatchedAjv.prototype = Ajv.prototype;
  PatchedAjv.default = PatchedAjv;

  for (const key of Object.keys(Ajv)) {
    try {
      PatchedAjv[key] = Ajv[key];
    } catch {
      // Some Ajv static properties are read-only in v8; ignore copy errors.
    }
  }

  return PatchedAjv;
};
