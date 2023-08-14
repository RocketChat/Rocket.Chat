import { TabsItem } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { Dispatch, ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export const TabElement = ({
  block,
  context,
  surfaceRenderer,
  index,
  select,
}: BlockProps<UiKit.ExperimentalTabElement> & {
  select: Dispatch<number>;
}): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  const { title, selected, disabled } = block;

  return (
    <TabsItem
      selected={selected}
      disabled={loading ? true : disabled}
      onClick={(e) => {
        !disabled && select(index);
        !disabled && action(e);
      }}
    >
      {surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE)}
    </TabsItem>
  );
};
