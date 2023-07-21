import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type TabNavigationBlockProps = BlockProps<UiKit.TabNavigationBlock>;

const TabNavigationBlock = ({
  block: { tabs, blockId },
}: TabNavigationBlockProps): ReactElement => (
  <Tabs marginBlock='x24'>
    {tabs.map(({ title, disabled, selected, elements }, idx) => (
      <TabsItem
        key={`${blockId}_${idx}`}
        selected={selected}
        disabled={disabled}
      >
        {title}
      </TabsItem>
    ))}
  </Tabs>
);

export default memo(TabNavigationBlock);
