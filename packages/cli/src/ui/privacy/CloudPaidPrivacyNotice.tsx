/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Newline, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { uiTranslator } from '../i18n.js';

interface CloudPaidPrivacyNoticeProps {
  onExit: () => void;
}

export const CloudPaidPrivacyNotice = ({
  onExit,
}: CloudPaidPrivacyNoticeProps) => {
  const t = uiTranslator;

  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        onExit();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={theme.text.accent}>
        {t('ui.privacy.cloudPaid.title')}
      </Text>
      <Newline />
      <Text color={theme.text.primary}>
        {t('ui.privacy.cloudPaid.noticeIntro')}{' '}
        <Text color={theme.text.link}>[1]</Text>{' '}
        {t('ui.privacy.cloudPaid.noticeMid')}{' '}
        {t('ui.privacy.cloudPaid.platform')}{' '}
        <Text color={theme.status.success}>[2]</Text>{' '}
        {t('ui.privacy.cloudPaid.noticeRest')}
      </Text>
      <Newline />
      <Text color={theme.text.primary}>
        <Text color={theme.text.link}>[1]</Text>{' '}
        {t('ui.privacy.cloudPaid.serviceTermsUrl')}
      </Text>
      <Text color={theme.text.primary}>
        <Text color={theme.status.success}>[2]</Text>{' '}
        {t('ui.privacy.cloudPaid.servicesUrl')}
      </Text>
      <Newline />
      <Text color={theme.text.secondary}>
        {t('ui.privacy.cloudPaid.exitHint')}
      </Text>
    </Box>
  );
};
