/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '../../../test-utils/render.js';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { useUIState } from '../../contexts/UIStateContext.js';
import { ExtensionUpdateState } from '../../state/extensions.js';
import { ExtensionsList } from './ExtensionsList.js';
import { uiTranslator } from '../../i18n.js';

vi.mock('../../contexts/UIStateContext.js');

const mockUseUIState = vi.mocked(useUIState);
const t = uiTranslator;

const mockExtensions = [
  {
    name: 'ext-one',
    version: '1.0.0',
    isActive: true,
    path: '/path/to/ext-one',
    contextFiles: [],
    id: '',
  },
  {
    name: 'ext-two',
    version: '2.1.0',
    isActive: true,
    path: '/path/to/ext-two',
    contextFiles: [],
    id: '',
  },
  {
    name: 'ext-disabled',
    version: '3.0.0',
    isActive: false,
    path: '/path/to/ext-disabled',
    contextFiles: [],
    id: '',
  },
];

describe('<ExtensionsList />', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockUIState = (
    extensionsUpdateState: Map<string, ExtensionUpdateState>,
  ) => {
    mockUseUIState.mockReturnValue({
      extensionsUpdateState,
      // Add other required properties from UIState if needed by the component
    } as never);
  };

  it('should render "No extensions installed." if there are no extensions', () => {
    mockUIState(new Map());
    const { lastFrame, unmount } = render(<ExtensionsList extensions={[]} />);
    expect(lastFrame()).toContain(t('ui.extensions.list.noneInstalled'));
    unmount();
  });

  it('should render a list of extensions with their version and status', () => {
    mockUIState(new Map());
    const { lastFrame, unmount } = render(
      <ExtensionsList extensions={mockExtensions} />,
    );
    const output = lastFrame();
    expect(output).toContain(
      `ext-one (v1.0.0) - ${t('ui.extensions.list.status.active')}`,
    );
    expect(output).toContain(
      `ext-two (v2.1.0) - ${t('ui.extensions.list.status.active')}`,
    );
    expect(output).toContain(
      `ext-disabled (v3.0.0) - ${t('ui.extensions.list.status.disabled')}`,
    );
    unmount();
  });

  it('should display "unknown state" if an extension has no update state', () => {
    mockUIState(new Map());
    const { lastFrame, unmount } = render(
      <ExtensionsList extensions={[mockExtensions[0]]} />,
    );
    expect(lastFrame()).toContain(
      `(${t('ui.extensions.list.states.unknown')})`,
    );
    unmount();
  });

  const stateTestCases = [
    {
      state: ExtensionUpdateState.CHECKING_FOR_UPDATES,
      expectedText: t('ui.extensions.list.states.checking_for_updates'),
    },
    {
      state: ExtensionUpdateState.UPDATING,
      expectedText: t('ui.extensions.list.states.updating'),
    },
    {
      state: ExtensionUpdateState.UPDATE_AVAILABLE,
      expectedText: t('ui.extensions.list.states.update_available'),
    },
    {
      state: ExtensionUpdateState.UPDATED_NEEDS_RESTART,
      expectedText: t('ui.extensions.list.states.updated_needs_restart'),
    },
    {
      state: ExtensionUpdateState.UPDATED,
      expectedText: t('ui.extensions.list.states.updated'),
    },
    {
      state: ExtensionUpdateState.ERROR,
      expectedText: t('ui.extensions.list.states.error'),
    },
    {
      state: ExtensionUpdateState.UP_TO_DATE,
      expectedText: t('ui.extensions.list.states.up_to_date'),
    },
  ];

  for (const { state, expectedText } of stateTestCases) {
    it(`should correctly display the state: ${state}`, () => {
      const updateState = new Map([[mockExtensions[0].name, state]]);
      mockUIState(updateState);
      const { lastFrame, unmount } = render(
        <ExtensionsList extensions={[mockExtensions[0]]} />,
      );
      expect(lastFrame()).toContain(`(${expectedText})`);
      unmount();
    });
  }
});
