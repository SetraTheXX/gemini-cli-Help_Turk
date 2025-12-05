/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createTranslator, type Translator } from '../i18n/index.js';
import { detectLocale } from '../utils/locale.js';

export const uiTranslator: Translator = createTranslator(
  detectLocale(process.env, 'en'),
);
