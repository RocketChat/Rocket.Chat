import { Tabs } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useCallback } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type TabNavigationElementProps = BlockProps<UiKit.TabNavigationElement>;

const TabNavigationElement = ({
  block,
  context,
  surfaceRenderer,
}: TabNavigationElementProps): ReactElement => {
  const [{ loading, value }, action] = useUiKitState(block, context);
  const { options } = block;

  const handleChange = useCallback(
    (value) => {
      action({ target: { value } });
    },
    [action]
  );

  return (
    <Tabs disabled={loading}>
      {options.map((tabItem) => {
        const isSelected = tabItem.value === value || tabItem.selected;
        const isDisabled = tabItem?.disabled;

        return (
          <Tabs.Item
            key={tabItem.value}
            disabled={isDisabled}
            selected={isSelected}
            onClick={() => {
              if (isDisabled) {
                return;
              }

              handleChange(tabItem.value);
            }}
          >
            {surfaceRenderer.renderTextObject(
              tabItem.text,
              0,
              UiKit.BlockContext.NONE
            )}
          </Tabs.Item>
        );
      })}
    </Tabs>
  );
};

export default memo(TabNavigationElement);
