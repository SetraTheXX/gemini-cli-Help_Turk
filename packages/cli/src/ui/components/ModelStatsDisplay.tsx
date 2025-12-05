/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { formatDuration } from '../utils/formatters.js';
import {
  calculateAverageLatency,
  calculateCacheHitRate,
  calculateErrorRate,
} from '../utils/computeStats.js';
import type { ModelMetrics } from '../contexts/SessionContext.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { uiTranslator } from '../i18n.js';

const METRIC_COL_WIDTH = 28;
const MODEL_COL_WIDTH = 22;

interface StatRowProps {
  title: string;
  values: Array<string | React.ReactElement>;
  isSubtle?: boolean;
  isSection?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({
  title,
  values,
  isSubtle = false,
  isSection = false,
}) => (
  <Box>
    <Box width={METRIC_COL_WIDTH}>
      <Text
        bold={isSection}
        color={isSection ? theme.text.primary : theme.text.link}
      >
        {isSubtle ? `  ↳ ${title}` : title}
      </Text>
    </Box>
    {values.map((value, index) => (
      <Box width={MODEL_COL_WIDTH} key={index}>
        <Text color={theme.text.primary}>{value}</Text>
      </Box>
    ))}
  </Box>
);

export const ModelStatsDisplay: React.FC = () => {
  const t = uiTranslator;
  const { stats } = useSessionStats();
  const { models } = stats.metrics;
  const activeModels = Object.entries(models).filter(
    ([, metrics]) => metrics.api.totalRequests > 0,
  );

  if (activeModels.length === 0) {
    return (
      <Box
        borderStyle="round"
        borderColor={theme.border.default}
        paddingY={1}
        paddingX={2}
      >
        <Text color={theme.text.primary}>{t('ui.modelStats.noApiCalls')}</Text>
      </Box>
    );
  }

  const modelNames = activeModels.map(([name]) => name);

  const getModelValues = (
    getter: (metrics: ModelMetrics) => string | React.ReactElement,
  ) => activeModels.map(([, metrics]) => getter(metrics));

  const hasThoughts = activeModels.some(
    ([, metrics]) => metrics.tokens.thoughts > 0,
  );
  const hasTool = activeModels.some(([, metrics]) => metrics.tokens.tool > 0);
  const hasCached = activeModels.some(
    ([, metrics]) => metrics.tokens.cached > 0,
  );

  return (
    <Box
      borderStyle="round"
      borderColor={theme.border.default}
      flexDirection="column"
      paddingY={1}
      paddingX={2}
    >
      <Text bold color={theme.text.accent}>
        {t('ui.modelStats.title')}
      </Text>
      <Box height={1} />

      {/* Header */}
      <Box>
        <Box width={METRIC_COL_WIDTH}>
          <Text bold color={theme.text.primary}>
            {t('ui.modelStats.metric')}
          </Text>
        </Box>
        {modelNames.map((name) => (
          <Box width={MODEL_COL_WIDTH} key={name}>
            <Text bold color={theme.text.primary}>
              {name}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Divider */}
      <Box
        borderStyle="single"
        borderBottom={true}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        borderColor={theme.border.default}
      />

      {/* API Section */}
      <StatRow title={t('ui.modelStats.apiSection')} values={[]} isSection />
      <StatRow
        title={t('ui.modelStats.requests')}
        values={getModelValues((m) => m.api.totalRequests.toLocaleString())}
      />
      <StatRow
        title={t('ui.modelStats.errors')}
        values={getModelValues((m) => {
          const errorRate = calculateErrorRate(m);
          return (
            <Text
              color={
                m.api.totalErrors > 0 ? theme.status.error : theme.text.primary
              }
            >
              {m.api.totalErrors.toLocaleString()} ({errorRate.toFixed(1)}%)
            </Text>
          );
        })}
      />
      <StatRow
        title={t('ui.modelStats.avgLatency')}
        values={getModelValues((m) => {
          const avgLatency = calculateAverageLatency(m);
          return formatDuration(avgLatency);
        })}
      />

      <Box height={1} />

      {/* Tokens Section */}
      <StatRow title={t('ui.modelStats.tokensSection')} values={[]} isSection />
      <StatRow
        title={t('ui.modelStats.total')}
        values={getModelValues((m) => (
          <Text color={theme.status.warning}>
            {m.tokens.total.toLocaleString()}
          </Text>
        ))}
      />
      <StatRow
        title={t('ui.modelStats.prompt')}
        isSubtle
        values={getModelValues((m) => m.tokens.prompt.toLocaleString())}
      />
      {hasCached && (
        <StatRow
          title={t('ui.modelStats.cached')}
          isSubtle
          values={getModelValues((m) => {
            const cacheHitRate = calculateCacheHitRate(m);
            return (
              <Text color={theme.status.success}>
                {m.tokens.cached.toLocaleString()} ({cacheHitRate.toFixed(1)}%)
              </Text>
            );
          })}
        />
      )}
      {hasThoughts && (
        <StatRow
          title={t('ui.modelStats.thoughts')}
          isSubtle
          values={getModelValues((m) => m.tokens.thoughts.toLocaleString())}
        />
      )}
      {hasTool && (
        <StatRow
          title={t('ui.modelStats.tool')}
          isSubtle
          values={getModelValues((m) => m.tokens.tool.toLocaleString())}
        />
      )}
      <StatRow
        title={t('ui.modelStats.output')}
        isSubtle
        values={getModelValues((m) => m.tokens.candidates.toLocaleString())}
      />
    </Box>
  );
};
