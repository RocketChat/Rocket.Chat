import { Tabs } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useCallback } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type TabNavigationElementProps = BlockProps<UiKit.TabNavigationElement>;

const TabNavigationElement = ({
  block,
  context,
}: TabNavigationElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);
  const { options } = block;

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <Tabs disabled={loading} onChange={handleChange}>
      {options.map((tabItem) => (
        <Tabs.Item
          key={tabItem.value}
          disabled={tabItem?.disabled}
          selected={tabItem?.selected}
        >
          {tabItem.text}
        </Tabs.Item>
      ))}
    </Tabs>
  );
};

export default memo(TabNavigationElement);
