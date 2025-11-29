/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { type Config } from '@google/gemini-cli-core';
import { t } from '../../i18n/index.js';
import { useSettings } from '../contexts/SettingsContext.js';

interface TipsProps {
  config: Config;
}

export const Tips: React.FC<TipsProps> = ({ config }) => {
  const geminiMdFileCount = config.getGeminiMdFileCount();
  const settings = useSettings();
  const locale = settings.merged;
  return (
    <Box flexDirection="column">
      <Text color={theme.text.primary}>
        {t('tips.title', { settings: locale })}
      </Text>
      <Text color={theme.text.primary}>
        {t('tips.line1', { settings: locale })}
      </Text>
      <Text color={theme.text.primary}>
        {t('tips.line2', { settings: locale })}
      </Text>
      {geminiMdFileCount === 0 && (
        <Text color={theme.text.primary}>
          3.{' '}
          <Text bold color={theme.text.accent}>
            GEMINI.md
          </Text>{' '}
          {t('tips.createGemini', { settings: locale })}
        </Text>
      )}
      <Text color={theme.text.primary}>
        {geminiMdFileCount === 0 ? '4.' : '3.'}{' '}
        <Text bold color={theme.text.accent}>
          /help
        </Text>{' '}
        {t('tips.help', { settings: locale })}
      </Text>
    </Box>
  );
};
