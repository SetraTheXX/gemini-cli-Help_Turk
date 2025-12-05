/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { useUIState } from '../contexts/UIStateContext.js';
import { theme } from '../semantic-colors.js';
import { uiTranslator } from '../i18n.js';

export const ExitWarning: React.FC = () => {
  const uiState = useUIState();
  const t = uiTranslator;
  return (
    <>
      {uiState.dialogsVisible && uiState.ctrlCPressedOnce && (
        <Box marginTop={1}>
          <Text color={theme.status.warning}>
            {t('ui.exitWarning.ctrlCAgain')}
          </Text>
        </Box>
      )}

      {uiState.dialogsVisible && uiState.ctrlDPressedOnce && (
        <Box marginTop={1}>
          <Text color={theme.status.warning}>
            {t('ui.exitWarning.ctrlDAgain')}
          </Text>
        </Box>
      )}
    </>
  );
};
