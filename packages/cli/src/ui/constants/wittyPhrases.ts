/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLocalizedArray } from '../../i18n/index.js';
import { detectLocale } from '../../utils/locale.js';

export const WITTY_LOADING_PHRASES =
  getLocalizedArray(
    detectLocale(process.env, 'en'),
    'ui.loading.wittyPhrases',
  ) ?? [];
